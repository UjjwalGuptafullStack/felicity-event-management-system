const mongoose = require('mongoose');
const { ACTOR_TYPES } = require('../utils/constants');

/**
 * In-app notification for a participant or organizer. Delivered via REST
 * (list/mark-read) and pushed live over Socket.io when the recipient has an
 * open connection (see utils/notify.js + sockets/teamChat.js).
 */
const notificationSchema = new mongoose.Schema({
  recipientType: {
    type: String,
    enum: Object.values(ACTOR_TYPES),
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, recipientId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
