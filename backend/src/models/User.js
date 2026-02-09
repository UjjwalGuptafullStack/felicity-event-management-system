const mongoose = require('mongoose');
const { USER_ROLES, PARTICIPANT_TYPES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true
  },
  participantType: {
    type: String,
    enum: Object.values(PARTICIPANT_TYPES),
    default: null
  },
  collegeOrOrg: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  preferences: {
    interests: {
      type: [String],
      default: []
    },
    followedOrganizers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer'
    }]
  }
}, {
  timestamps: true
});

// Index on email for unique constraint and fast lookups
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);