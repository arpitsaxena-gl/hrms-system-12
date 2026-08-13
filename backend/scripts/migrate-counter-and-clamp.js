/**
 * One-off, idempotent data-fix migration for SCRUM-80.
 *
 * Run this BEFORE deploying the code that enables the new `min:0` leaveBalance
 * constraint and the atomic employeeId counter:
 *
 *   node scripts/migrate-counter-and-clamp.js
 *
 * It (a) clamps any existing negative leave balances to 0 and logs affected
 * employees, and (b) seeds the `employeeId` Counter from the maximum existing
 * numeric suffix so newly generated ids never collide. Safe to re-run.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../src/models/Employee');
const Counter = require('../src/models/Counter');
const logger = require('../src/utils/logger');

const TYPES = ['annual', 'sick', 'casual', 'compensatory'];

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    logger.error('MONGODB_URI (or MONGO_URI) is not set. Aborting migration.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  logger.info('Connected. Running migrate-counter-and-clamp...');

  // 1) Clamp negative leave balances to 0.
  const orNegative = TYPES.map((t) => ({ [`leaveBalance.${t}`]: { $lt: 0 } }));
  const affected = await Employee.find({ $or: orNegative }).select('employeeId leaveBalance');
  for (const emp of affected) {
    const set = {};
    for (const t of TYPES) {
      if ((emp.leaveBalance && emp.leaveBalance[t]) < 0) set[`leaveBalance.${t}`] = 0;
    }
    await Employee.updateOne({ _id: emp._id }, { $set: set });
    logger.warn(`Clamped negative leave balance for ${emp.employeeId}: ${JSON.stringify(set)}`);
  }
  logger.info(`Clamped ${affected.length} employee(s) with negative balances.`);

  // 2) Seed the employeeId counter from the max existing numeric suffix.
  const emps = await Employee.find({ employeeId: /^EMP\d+$/ }).select('employeeId');
  let max = 0;
  for (const e of emps) {
    const n = parseInt(String(e.employeeId).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  await Counter.findByIdAndUpdate('employeeId', { $max: { seq: max } }, { upsert: true, new: true });
  logger.info(`Seeded employeeId counter to ${max}.`);

  await mongoose.disconnect();
  logger.info('Migration complete.');
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
