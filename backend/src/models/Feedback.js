const mongoose = require('mongoose');

/**
 * Feedback Model
 * Anonymous feedback for events (post-event only)
 */
const feedbackSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
feedbackSchema.index({ eventId: 1 });
feedbackSchema.index({ eventId: 1, submittedAt: -1 });
// Compound unique index to prevent duplicate feedback from same participant
feedbackSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
