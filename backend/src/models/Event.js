const mongoose = require('mongoose');
const { EVENT_TYPES, EVENT_STATUS } = require('../utils/constants');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(EVENT_TYPES),
    required: true
  },
  eligibility: {
    type: String,
    trim: true
  },
  registrationDeadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  registrationLimit: {
    type: Number,
    min: 0
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: Object.values(EVENT_STATUS),
    default: EVENT_STATUS.DRAFT
  },
  merchandiseDetails: {
    items: [{
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      variants: [{
        type: { type: String, trim: true },
        stock: { type: Number, default: 0 },
        price: { type: Number, default: 0 }
      }],
      image: { type: String, trim: true }
    }],
    perUserLimit: { type: Number, default: 1 },
    requiresApproval: { type: Boolean, default: true }
  },
  customFormSchema: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index on organizerId for filtering events by organizer
eventSchema.index({ organizerId: 1 });

module.exports = mongoose.model('Event', eventSchema);