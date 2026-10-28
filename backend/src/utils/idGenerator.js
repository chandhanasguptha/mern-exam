const Counter = require('../models/Counter');

/**
 * Extracts a 3-letter uppercase prefix from a company name.
 * Pads with 'X' if fewer than 3 characters, defaults to 'APP'.
 */
function getCompanyPrefix(companyName) {
  if (!companyName || typeof companyName !== 'string') {
    return 'APP';
  }
  const cleaned = companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length === 0) {
    return 'APP';
  }
  if (cleaned.length < 3) {
    return cleaned.padEnd(3, 'X');
  }
  return cleaned.substring(0, 3);
}

/**
 * Concurrency-safe generation of Application ID.
 * Example: JA-INF-001
 * Sequence increments separately per company.
 */
async function generateApplicationId(companyName) {
  const prefix = getCompanyPrefix(companyName);
  const counterKey = `company_${companyName.trim().toLowerCase()}`;

  // Atomic increment with upsert ensures concurrency safety
  const counter = await Counter.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const seqStr = String(counter.seq).padStart(3, '0');
  return `JA-${prefix}-${seqStr}`;
}

module.exports = {
  getCompanyPrefix,
  generateApplicationId
};
