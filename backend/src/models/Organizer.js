const mongoose = require('mongoose');
const { ORGANIZER_CATEGORIES } = require('../utils/constants');

const CATEGORY_VALUES = Object.values(ORGANIZER_CATEGORIES);

const organizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    enum: {
      values: CATEGORY_VALUES,
      message: `Category must be one of: ${CATEGORY_VALUES.join(', ')}`
    },
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  loginEmail: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Note: loginEmail already has a unique index via field definition (unique: true + sparse: true)
// No additional explicit index needed.

module.exports = mongoose.model('Organizer', organizerSchema);