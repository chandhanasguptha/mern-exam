const mongoose = require('mongoose');

let isMemoryServer = false;
let memoryServerInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // Option to explicitly force memory server via env flag
  if (process.env.USE_MEMORY_DB === 'true' || !uri) {
    return await startMemoryServer('Explicitly requested or MONGODB_URI not provided');
  }

  try {
    console.log('[DB] Connecting to MongoDB...');
    // Connect with a 5s timeout so it doesn't hang forever if placeholder cluster isn't reachable
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[DB] Successfully connected to MongoDB at ${mongoose.connection.host}/${mongoose.connection.name}`);
    isMemoryServer = false;
  } catch (err) {
    console.warn(`[DB] Direct connection to provided MONGODB_URI failed: ${err.message}`);
    console.log('[DB] Initializing In-Memory MongoDB instance for development & testing...');
    await startMemoryServer(`Fallback due to: ${err.message}`);
  }
}

async function startMemoryServer(reason) {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memUri = memoryServerInstance.getUri();
    await mongoose.connect(memUri);
    isMemoryServer = true;
    console.log(`[DB] Connected to MongoDB Memory Server: ${memUri} (${reason})`);
  } catch (memErr) {
    console.error('[DB] Failed to start MongoDB Memory Server:', memErr.message);
    throw memErr;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
}

function getDatabaseStatus() {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state: readyStateMap[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'none',
    database: mongoose.connection.name || 'none',
    isMemoryDb: isMemoryServer
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseStatus
};
