const mongoose = require('mongoose');

/**
 * ChatMessage Model
 * Stores real-time team chat messages for hackathon team rooms.
 * Chat is only available when team.status === 'complete'.
 */
const chatMessageSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'file'],
      default: 'text'
    },
    fileUrl: {
      type: String,
      trim: true
    },
    fileName: {
      type: String,
      trim: true
    },
    fileType: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// For pagination (load older messages)
chatMessageSchema.index({ teamId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
