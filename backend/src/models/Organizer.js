const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
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

// Index on loginEmail for authentication lookups
organizerSchema.index({ loginEmail: 1 });

module.exports = mongoose.model('Organizer', organizerSchema);