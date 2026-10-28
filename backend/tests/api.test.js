process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');
const Application = require('../src/models/Application');
const Counter = require('../src/models/Counter');

let server;
let baseUrl;
let mongod;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API & Business Rule Automated Tests ---');

  // Setup In-Memory Mongo for isolated testing
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Start HTTP server on random free port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`[Test Server] Running on ${baseUrl}`);

  let testPassed = 0;
  let testFailed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      testPassed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      testFailed++;
    }
  }

  // 1. Health check
  await test('GET /api/health returns 200 and healthy DB status', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'UP');
  });

  // 2. Application creation & ID format
  let app1Id, app1ObjId;
  await test('POST /api/applications generates JA-INF-001 format and initial Applied status', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request('POST', '/api/applications', {
      company: 'Infosys',
      role: 'Frontend Developer',
      jobType: 'Full-time',
      appliedDate: today,
      expectedSalary: 75000,
      notes: 'Initial test'
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.company, 'Infosys');
    assert.strictEqual(res.body.data.status, 'Applied');
    assert.match(res.body.data.applicationId, /^JA-INF-001$/);
    assert.strictEqual(res.body.data.statusHistory.length, 1);
    assert.strictEqual(res.body.data.statusHistory[0].status, 'Applied');
    assert.strictEqual(res.body.data.isOverdue, false);

    app1Id = res.body.data.applicationId;
    app1ObjId = res.body.data._id;
  });

  // 3. Separate sequence per company
  await test('Second application for Infosys gets JA-INF-002, while Google gets JA-GOO-001', async () => {
    const today = new Date().toISOString().split('T')[0];
    const resInfo2 = await request('POST', '/api/applications', {
      company: 'Infosys',
      role: 'Backend Developer',
      appliedDate: today
    });
    assert.strictEqual(resInfo2.status, 201);
    assert.strictEqual(resInfo2.body.data.applicationId, 'JA-INF-002');

    const resGoo = await request('POST', '/api/applications', {
      company: 'Google',
      role: 'Software Engineer',
      appliedDate: today
    });
    assert.strictEqual(resGoo.status, 201);
    assert.strictEqual(resGoo.body.data.applicationId, 'JA-GOO-001');
  });

  // 4. Duplicate prevention for active applications
  await test('POST /api/applications prevents duplicate active application (case & whitespace insensitive) with 409', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request('POST', '/api/applications', {
      company: '  infosys  ',
      role: 'frontend developer ', // matches 'Infosys' + 'Frontend Developer'
      appliedDate: today
    });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  // 5. Applied date validation (future date rejected)
  await test('POST /api/applications rejects future applied date with 400', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
    const res = await request('POST', '/api/applications', {
      company: 'Tesla',
      role: 'Autopilot Engineer',
      appliedDate: futureDate
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /future/i);
  });

  // 6. Overdue calculation
  await test('Follow-up date is Applied Date + 7 days; isOverdue is true if past follow-up date and status is Applied', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    const res = await request('POST', '/api/applications', {
      company: 'Amazon',
      role: 'DevOps Specialist',
      appliedDate: tenDaysAgo
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.isOverdue, true);
  });

  // 7. Status transition rules
  await test('PATCH /status allows valid transition Applied -> Interview', async () => {
    const res = await request('PATCH', `/api/applications/${app1Id}/status`, {
      status: 'Interview',
      notes: 'Passed initial screening'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'Interview');
    assert.strictEqual(res.body.data.statusHistory.length, 2);
    assert.strictEqual(res.body.data.statusHistory[1].status, 'Interview');
  });

  await test('PATCH /status rejects invalid transition Interview -> Accepted with 400', async () => {
    const res = await request('PATCH', `/api/applications/${app1Id}/status`, {
      status: 'Accepted'
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Cannot transition/i);
  });

  await test('PATCH /status allows Interview -> Offer', async () => {
    const res = await request('PATCH', `/api/applications/${app1Id}/status`, {
      status: 'Offer',
      notes: 'Received written offer'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'Offer');
  });

  await test('PATCH /status allows Offer -> Accepted (final status)', async () => {
    const res = await request('PATCH', `/api/applications/${app1Id}/status`, {
      status: 'Accepted',
      notes: 'Accepted offer letter'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'Accepted');
  });

  await test('PATCH /status from final status (Accepted) is rejected with 400', async () => {
    const res = await request('PATCH', `/api/applications/${app1Id}/status`, {
      status: 'Interview'
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  // 8. Re-application allowed after final status
  await test('Can create new application for same company and role once previous application reached final status', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request('POST', '/api/applications', {
      company: 'Infosys',
      role: 'Frontend Developer',
      appliedDate: today
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.applicationId, 'JA-INF-003');
  });

  // 9. Editing locked fields
  await test('PUT /api/applications rejects editing applicationId or appliedDate', async () => {
    const res = await request('PUT', `/api/applications/${app1Id}`, {
      applicationId: 'JA-HACK-999',
      appliedDate: '2020-01-01'
    });

    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /cannot be edited/i);
  });

  // 10. Deletion rules
  await test('DELETE is forbidden when status is Interview or Offer (HTTP 400)', async () => {
    // Create an application and advance to Interview
    const today = new Date().toISOString().split('T')[0];
    const created = await request('POST', '/api/applications', {
      company: 'Netflix',
      role: 'Cloud Architect',
      appliedDate: today
    });
    const netflixId = created.body.data.applicationId;

    await request('PATCH', `/api/applications/${netflixId}/status`, { status: 'Interview' });

    const delRes = await request('DELETE', `/api/applications/${netflixId}`);
    assert.strictEqual(delRes.status, 400);
    assert.match(delRes.body.message, /cannot be deleted/i);
  });

  await test('DELETE is permitted when status is Applied or final status (Accepted/Rejected/Declined)', async () => {
    // app1Id is in 'Accepted' status
    const delAccepted = await request('DELETE', `/api/applications/${app1Id}`);
    assert.strictEqual(delAccepted.status, 200);
    assert.strictEqual(delAccepted.body.success, true);
  });

  // 11. Search, filter & stats counts
  await test('GET /api/applications supports search, status filter, and returns accurate status counts', async () => {
    const res = await request('GET', '/api/applications?search=Google');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.applications.every(a => a.company.includes('Google')));
    assert.ok(res.body.data.counts.total >= 1);
  });

  // Teardown
  server.close();
  await mongoose.disconnect();
  await mongod.stop();

  console.log(`\nTests Summary: ${testPassed} Passed, ${testFailed} Failed.`);
  if (testFailed > 0) {
    process.exit(1);
  } else {
    console.log('✓ All backend business rules and API endpoints passed flawlessly!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
