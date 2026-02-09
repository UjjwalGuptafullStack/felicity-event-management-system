const mongoose = require('mongoose');

/**
 * DiscussionMessage Model
 * Real-time discussion forum messages for events
 */
const discussionMessageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['participant', 'organizer'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiscussionMessage',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  },
  deletedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Indexes for efficient queries
discussionMessageSchema.index({ eventId: 1, createdAt: -1 });
discussionMessageSchema.index({ eventId: 1, isPinned: -1, createdAt: -1 });
discussionMessageSchema.index({ eventId: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('DiscussionMessage', discussionMessageSchema);
