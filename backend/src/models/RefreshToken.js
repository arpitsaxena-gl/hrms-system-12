const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Server-side refresh-token store enabling rotation and revocation (SEC-7).
 * Only the SHA-256 hash of each token is persisted. Expired documents are
 * removed automatically by the TTL index.
 */
const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.statics.hash = function hash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

refreshTokenSchema.statics.issue = function issue(userId, token, expiresAt, session) {
  const doc = { user: userId, tokenHash: this.hash(token), expiresAt };
  return this.create(session ? [doc] : doc, session ? { session } : undefined)
    .then((r) => (Array.isArray(r) ? r[0] : r));
};

refreshTokenSchema.statics.findActive = function findActive(token) {
  return this.findOne({ tokenHash: this.hash(token), revokedAt: null, expiresAt: { $gt: new Date() } });
};

refreshTokenSchema.statics.revoke = function revoke(token) {
  return this.updateOne({ tokenHash: this.hash(token) }, { revokedAt: new Date() });
};

refreshTokenSchema.statics.revokeAllForUser = function revokeAllForUser(userId) {
  return this.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
