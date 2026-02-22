const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  isScanned: {
    type: Boolean,
    default: false
  },
  scannedAt: {
    type: Date
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
});

// Note: ticketId already has a unique index via field definition (unique: true)
module.exports = mongoose.model('Ticket', ticketSchema);