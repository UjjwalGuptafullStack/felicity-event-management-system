const mongoose = require('mongoose');

/**
 * PasswordResetRequest Model
 * Tracks organizer password reset requests for admin approval
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
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
  }
});

// Indexes for efficient queries
passwordResetRequestSchema.index({ organizerId: 1, status: 1 });
passwordResetRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
