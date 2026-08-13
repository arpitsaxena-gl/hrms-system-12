const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

/**
 * Atomically increment and return the next sequence value for a named counter.
 * Used to generate collision-free employeeIds under concurrency (PERF-6),
 * replacing the previous countDocuments() check-then-act race.
 */
counterSchema.statics.next = async function next(name, session) {
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;
  const doc = await this.findByIdAndUpdate(name, { $inc: { seq: 1 } }, opts);
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
