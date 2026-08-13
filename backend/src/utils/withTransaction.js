const mongoose = require('mongoose');
const { env } = require('../config/env');
const logger = require('../utils/logger');

let warnedOnce = false;

/**
 * Run a unit of work atomically inside a Mongoose transaction.
 *
 * The callback receives the active session (or `null` when transactions are
 * disabled) and MUST pass it to every model operation it performs so the whole
 * unit commits or rolls back together.
 *
 * When TRANSACTIONS_ENABLED=false (standalone dev Mongo without a replica set)
 * the work runs WITHOUT atomicity and a loud warning is logged once. This mode
 * is for local development only and must never be used in production.
 */
async function withTransaction(work) {
  if (!env.TRANSACTIONS_ENABLED) {
    if (!warnedOnce) {
      logger.warn(
        'TRANSACTIONS_ENABLED=false — running multi-document writes WITHOUT atomicity. Do NOT use in production.'
      );
      warnedOnce = true;
    }
    return work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    session.endSession();
  }
}

module.exports = { withTransaction };
