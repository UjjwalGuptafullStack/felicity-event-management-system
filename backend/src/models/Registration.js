const mongoose = require('mongoose');
const { REGISTRATION_TYPES, REGISTRATION_STATUS } = require('../utils/constants');

const registrationSchema = new mongoose.Schema({
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
  registrationType: {
    type: String,
    enum: Object.values(REGISTRATION_TYPES),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(REGISTRATION_STATUS),
    default: REGISTRATION_STATUS.REGISTERED
  },
  // Merchandise payment approval fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_required'],
    default: 'not_required'
  },
  paymentProofUrl: {
    type: String,
    trim: true
  },
  purchasedItems: [{
    itemIndex: Number,
    variantIndex: Number,
    quantity: Number,
    priceAtPurchase: Number
  }],
  totalAmount: {
    type: Number,
    default: 0
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index on eventId for finding all registrations for an event
registrationSchema.index({ eventId: 1 });

// Compound unique index to prevent duplicate registrations
registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);