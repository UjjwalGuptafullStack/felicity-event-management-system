const mongoose = require('mongoose');

/**
 * Attendance Model
 * Tracks event attendance via QR code scanning or manual entry
 */
const attendanceSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scannedAt: {
    type: Date,
    default: Date.now
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  scanMethod: {
    type: String,
    enum: ['qr_scan', 'manual_entry'],
    default: 'qr_scan'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceSchema.index({ eventId: 1, participantId: 1 });
attendanceSchema.index({ eventId: 1, scannedAt: -1 });
// Unique constraint: one ticket can only be scanned once
attendanceSchema.index({ ticketId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
