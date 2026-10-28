require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const Application = require('../src/models/Application');
const Counter = require('../src/models/Counter');
const { generateApplicationId } = require('../src/utils/idGenerator');
const { STATUS, computeFollowUpInfo } = require('../src/utils/statusRules');

async function seedData() {
  console.log('[Seed] Starting database seeding...');
  await connectDB();

  // Clear existing data
  await Application.deleteMany({});
  await Counter.deleteMany({});
  console.log('[Seed] Cleared existing applications and sequence counters.');

  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const sampleApplications = [
    {
      company: 'Google',
      role: 'Senior Frontend Engineer',
      jobType: 'Full-time',
      appliedDate: daysAgo(10), // Overdue applied (> 7 days ago)
      expectedSalary: 160000,
      notes: 'Applied through Google Careers portal. Referral by Alex.',
      status: STATUS.APPLIED,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(10), notes: 'Application submitted online' }
      ]
    },
    {
      company: 'Infosys',
      role: 'Full Stack Developer',
      jobType: 'Full-time',
      appliedDate: daysAgo(3), // Fresh applied (< 7 days ago)
      expectedSalary: 85000,
      notes: 'Applied on LinkedIn Easy Apply. Waiting for recruiter review.',
      status: STATUS.APPLIED,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(3), notes: 'Submitted via LinkedIn' }
      ]
    },
    {
      company: 'Microsoft',
      role: 'Cloud Solutions Architect',
      jobType: 'Full-time',
      appliedDate: daysAgo(14),
      expectedSalary: 175000,
      notes: 'First round technical screen completed with engineering manager.',
      status: STATUS.INTERVIEW,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(14), notes: 'Applied via careers portal' },
        { status: STATUS.INTERVIEW, changedAt: daysAgo(5), notes: 'Technical round scheduled' }
      ]
    },
    {
      company: 'Stripe',
      role: 'Backend Engineer - Payments',
      jobType: 'Full-time',
      appliedDate: daysAgo(21),
      expectedSalary: 190000,
      notes: 'Received written offer package! Negotiating signing bonus.',
      status: STATUS.OFFER,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(21), notes: 'Applied directly' },
        { status: STATUS.INTERVIEW, changedAt: daysAgo(12), notes: 'Completed onsite rounds' },
        { status: STATUS.OFFER, changedAt: daysAgo(2), notes: 'Formal offer received via email' }
      ]
    },
    {
      company: 'Amazon',
      role: 'Software Development Engineer II',
      jobType: 'Full-time',
      appliedDate: daysAgo(30),
      expectedSalary: 165000,
      notes: 'Accepted offer! Start date set for next month.',
      status: STATUS.ACCEPTED,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(30), notes: 'Applied on amazon.jobs' },
        { status: STATUS.INTERVIEW, changedAt: daysAgo(18), notes: 'Loop interview completed' },
        { status: STATUS.OFFER, changedAt: daysAgo(7), notes: 'Offer letter extended' },
        { status: STATUS.ACCEPTED, changedAt: daysAgo(3), notes: 'Signed offer agreement' }
      ]
    },
    {
      company: 'Meta',
      role: 'Product Engineer',
      jobType: 'Full-time',
      appliedDate: daysAgo(40),
      expectedSalary: 180000,
      notes: 'Declined due to better compensation package elsewhere.',
      status: STATUS.DECLINED,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(40), notes: 'Referral application' },
        { status: STATUS.INTERVIEW, changedAt: daysAgo(25), notes: 'System design interview' },
        { status: STATUS.OFFER, changedAt: daysAgo(10), notes: 'Offer received' },
        { status: STATUS.DECLINED, changedAt: daysAgo(4), notes: 'Politely declined offer' }
      ]
    },
    {
      company: 'Netflix',
      role: 'UI Platform Engineer',
      jobType: 'Contract',
      appliedDate: daysAgo(25),
      expectedSalary: 150000,
      notes: 'Position closed internally.',
      status: STATUS.REJECTED,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(25), notes: 'Applied via job board' },
        { status: STATUS.REJECTED, changedAt: daysAgo(15), notes: 'Automated rejection email' }
      ]
    },
    {
      company: 'Spotify',
      role: 'Web Engineering Intern',
      jobType: 'Internship',
      appliedDate: daysAgo(12), // Overdue applied
      expectedSalary: 60000,
      notes: 'Summer internship application for web player team.',
      status: STATUS.APPLIED,
      history: [
        { status: STATUS.APPLIED, changedAt: daysAgo(12), notes: 'Portfolio submitted' }
      ]
    }
  ];

  for (const item of sampleApplications) {
    const applicationId = await generateApplicationId(item.company);
    const { followUpDate } = computeFollowUpInfo(item.appliedDate, item.status);

    const doc = new Application({
      applicationId,
      company: item.company,
      role: item.role,
      jobType: item.jobType,
      appliedDate: item.appliedDate,
      expectedSalary: item.expectedSalary,
      notes: item.notes,
      status: item.status,
      statusHistory: item.history,
      followUpDate,
      normalizedCompany: item.company.toLowerCase().trim(),
      normalizedRole: item.role.toLowerCase().trim()
    });

    await doc.save();
    console.log(`[Seed] Created ${applicationId} - ${item.company} (${item.role}) [Status: ${item.status}]`);
  }

  console.log('[Seed] Seeding completed successfully!');
  await disconnectDB();
  process.exit(0);
}

seedData().catch(err => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
