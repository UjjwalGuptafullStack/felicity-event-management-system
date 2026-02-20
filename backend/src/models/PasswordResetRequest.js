const mongoose = require('mongoose');

/**
 * PasswordResetRequest Model
 * Tracks organizer password reset requests for admin approval.
 *
 * Two request types:
 *   'self_change'    - Organizer is logged in and wants to set their own new password.
 *                      Admin approves → organizer enters new password → marked 'completed'.
 *   'forgot_password' - Organizer cannot log in.
 *                      Admin approves → admin generates a temp password → emailed to organizer.
 */
const passwordResetRequestSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['self_change', 'forgot_password'],
    default: 'forgot_password'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  adminComment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  newPasswordHash: {
    type: String
  },
  temporaryPassword: {
    type: String
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
});

// Indexes for efficient queries
passwordResetRequestSchema.index({ organizerId: 1, status: 1 });
passwordResetRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);

