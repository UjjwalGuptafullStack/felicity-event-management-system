/**
 * Shared self-service password reset helpers, used by both the participant/
 * organizer-initiated "forgot password" flow (authController) and the
 * admin-initiated "send reset link" action (adminController).
 */
const crypto = require('crypto');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('./emailService');
const { ACTOR_TYPES } = require('./constants');
const config = require('../config/env');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Creates a reset token for the given actor and emails the reset link.
 * Fire-and-forget on the email send — callers should not await failures
 * as fatal (matches the rest of the app's non-blocking email pattern).
 */
const issuePasswordReset = async ({ actorType, actorId, recipientEmail, recipientName }) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await PasswordResetToken.create({
    actorType,
    actorId,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
  });

  const roleParam = actorType === ACTOR_TYPES.ORGANIZER ? 'organizer' : 'participant';
  const resetUrl = `${config.appUrl}/reset-password?token=${rawToken}&actorType=${roleParam}`;

  return sendPasswordResetEmail(recipientEmail, recipientName, resetUrl);
};

/**
 * Looks up a valid (unused, unexpired) reset token by its raw value.
 * Returns the PasswordResetToken document, or null if invalid/expired.
 */
const findValidResetToken = async ({ token, actorType }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return PasswordResetToken.findOne({
    tokenHash,
    actorType,
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

module.exports = { issuePasswordReset, findValidResetToken };
