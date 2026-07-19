const mongoose = require('mongoose');
const { ACTOR_TYPES } = require('../utils/constants');

/**
 * Self-service password reset token — a hashed, single-use, time-limited
 * token emailed to a participant or organizer. Replaces the old manual
 * admin-approval PasswordResetRequest flow.
 */
const passwordResetTokenSchema = new mongoose.Schema({
  actorType: {
    type: String,
    enum: Object.values(ACTOR_TYPES),
    required: true
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

passwordResetTokenSchema.index({ actorType: 1, actorId: 1 });
// TTL index — MongoDB automatically deletes documents once expiresAt is in the past
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
