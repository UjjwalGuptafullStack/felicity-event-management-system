const mongoose = require('mongoose');
const { TEAM_STATUS } = require('../utils/constants');

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  maxSize: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  members: {
    type: [teamMemberSchema],
    default: []
  },
  status: {
    type: String,
    enum: Object.values(TEAM_STATUS),
    default: TEAM_STATUS.FORMING
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Fast lookups by invite code
teamSchema.index({ inviteCode: 1 });
// All teams for an event
teamSchema.index({ eventId: 1 });
// All teams a user is part of
teamSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Team', teamSchema);
