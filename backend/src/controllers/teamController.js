/**
 * Team Controller
 *
 * Handles hackathon team-based event registration:
 *   - Create team (leader)
 *   - Join via invite code (members)
 *   - View my teams
 *   - Team detail
 *   - Cancel team (leader)
 *   - Leave team (member)
 *
 * Auto-generates registrations + tickets for all members when a team is full.
 */

const crypto = require('crypto');
const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { EVENT_STATUS, REGISTRATION_STATUS, REGISTRATION_TYPES, TEAM_STATUS } = require('../utils/constants');

// ─── helpers ──────────────────────────────────────────────────────────────────

/** 6-char uppercase hex invite code */
const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

/** Generate a unique invite code (retries to avoid collisions) */
const uniqueCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const exists = await Team.exists({ inviteCode: code });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique invite code');
};

/** Create Registration + Ticket for one participant */
const issueTicket = async (eventId, participantId) => {
  const registration = new Registration({
    eventId,
    participantId,
    registrationType: REGISTRATION_TYPES.NORMAL,
    status: REGISTRATION_STATUS.REGISTERED
  });
  await registration.save();

  const ticketId = `TKT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const ticket = new Ticket({
    registrationId: registration._id,
    ticketId,
    qrCode: ticketId   // QR payload == ticketId for scanner compatibility
  });
  await ticket.save();

  return { registration, ticket };
};

/** Mark team complete and issue registrations+tickets for all members */
const completeTeam = async (team) => {
  const results = [];
  for (const member of team.members) {
    // Skip if already registered (idempotent)
    const existing = await Registration.findOne({
      eventId: team.eventId,
      participantId: member.userId
    });
    if (!existing) {
      const r = await issueTicket(team.eventId, member.userId);
      results.push(r);
    }
  }
  team.status = TEAM_STATUS.COMPLETE;
  await team.save();
  return results;
};

// ─── controllers ──────────────────────────────────────────────────────────────

/**
 * Create a team for a team-capable event.
 * POST /participant/events/:eventId/teams
 * Body: { name, maxSize }
 */
const createTeam = async (req, res) => {
  try {
    const { eventId } = req.params;
    const leaderId = req.actor.id;
    const { name, maxSize } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.status !== EVENT_STATUS.PUBLISHED) {
      return res.status(400).json({ success: false, message: 'Event is not open for registration' });
    }
    if (!event.teamRegistration?.enabled) {
      return res.status(400).json({ success: false, message: 'This event does not support team registration' });
    }

    const now = new Date();
    if (event.registrationDeadline && new Date(event.registrationDeadline) <= now) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    const { minSize, maxSize: eventMax } = event.teamRegistration;
    const requestedSize = parseInt(maxSize);
    if (!requestedSize || requestedSize < minSize || requestedSize > eventMax) {
      return res.status(400).json({
        success: false,
        message: `Team size must be between ${minSize} and ${eventMax}`
      });
    }

    // Check leader not already in a team for this event
    const existing = await Team.findOne({
      eventId,
      'members.userId': leaderId,
      status: TEAM_STATUS.FORMING
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a forming team for this event'
      });
    }

    // Check leader not already individually registered
    const alreadyReg = await Registration.findOne({ eventId, participantId: leaderId });
    if (alreadyReg) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    const inviteCode = await uniqueCode();

    const team = new Team({
      eventId,
      leaderId,
      name: name.trim(),
      inviteCode,
      maxSize: requestedSize,
      members: [{ userId: leaderId }],
      status: TEAM_STATUS.FORMING
    });
    await team.save();

    await team.populate('eventId', 'name startDate');
    await team.populate('members.userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Team created! Share the invite code with your teammates.',
      team: formatTeam(team, leaderId)
    });
  } catch (err) {
    console.error('createTeam error:', err);
    res.status(500).json({ success: false, message: 'Failed to create team' });
  }
};

/**
 * Join a team using its invite code.
 * POST /participant/teams/join
 * Body: { inviteCode }
 */
const joinTeamByCode = async (req, res) => {
  try {
    const userId = req.actor.id;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() })
      .populate('eventId');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    const event = team.eventId;

    if (team.status !== TEAM_STATUS.FORMING) {
      return res.status(400).json({
        success: false,
        message: team.status === TEAM_STATUS.COMPLETE
          ? 'This team is already full and complete'
          : 'This team is no longer accepting members'
      });
    }

    const now = new Date();
    if (event.registrationDeadline && new Date(event.registrationDeadline) <= now) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Already in this team?
    if (team.members.some(m => m.userId.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'You are already in this team' });
    }

    // Already in another forming team for this event?
    const otherTeam = await Team.findOne({
      eventId: event._id,
      'members.userId': userId,
      status: TEAM_STATUS.FORMING,
      _id: { $ne: team._id }
    });
    if (otherTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in another team for this event'
      });
    }

    // Already registered individually?
    const alreadyReg = await Registration.findOne({ eventId: event._id, participantId: userId });
    if (alreadyReg) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    // Check capacity
    if (team.members.length >= team.maxSize) {
      return res.status(400).json({ success: false, message: 'This team is already full' });
    }

    team.members.push({ userId });
    const isFull = team.members.length >= team.maxSize;

    let completionMessage = '';
    if (isFull) {
      await completeTeam(team);
      completionMessage = ' Team is now complete — tickets issued for all members!';
    } else {
      await team.save();
    }

    await team.populate('members.userId', 'firstName lastName email');
    await team.populate('eventId', 'name startDate');

    res.status(200).json({
      success: true,
      message: `Joined team "${team.name}" successfully.${completionMessage}`,
      team: formatTeam(team, userId)
    });
  } catch (err) {
    console.error('joinTeamByCode error:', err);
    res.status(500).json({ success: false, message: 'Failed to join team' });
  }
};

/**
 * Get all teams the current user is part of.
 * GET /participant/me/teams
 */
const getMyTeams = async (req, res) => {
  try {
    const userId = req.actor.id;

    const teams = await Team.find({ 'members.userId': userId })
      .populate('eventId', 'name startDate endDate registrationDeadline')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      teams: teams.map(t => formatTeam(t, userId))
    });
  } catch (err) {
    console.error('getMyTeams error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch teams' });
  }
};

/**
 * Get full detail of a single team.
 * GET /participant/teams/:teamId
 */
const getTeamDetail = async (req, res) => {
  try {
    const userId = req.actor.id;

    const team = await Team.findById(req.params.teamId)
      .populate('eventId', 'name startDate endDate registrationDeadline teamRegistration')
      .populate('members.userId', 'firstName lastName email participantType');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Only members can view the team
    if (!team.members.some(m => m.userId._id.toString() === userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({
      success: true,
      team: formatTeam(team, userId)
    });
  } catch (err) {
    console.error('getTeamDetail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch team' });
  }
};

/**
 * Cancel team (leader only, while forming).
 * DELETE /participant/teams/:teamId
 */
const cancelTeam = async (req, res) => {
  try {
    const userId = req.actor.id;
    const team = await Team.findById(req.params.teamId);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.leaderId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the team leader can cancel the team' });
    }
    if (team.status !== TEAM_STATUS.FORMING) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a team that is already complete' });
    }

    team.status = TEAM_STATUS.CANCELLED;
    await team.save();

    res.status(200).json({ success: true, message: 'Team cancelled' });
  } catch (err) {
    console.error('cancelTeam error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel team' });
  }
};

/**
 * Leave a team (member, not leader, while forming).
 * POST /participant/teams/:teamId/leave
 */
const leaveTeam = async (req, res) => {
  try {
    const userId = req.actor.id;
    const team = await Team.findById(req.params.teamId);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const isMember = team.members.some(m => m.userId.toString() === userId);
    if (!isMember) return res.status(403).json({ success: false, message: 'You are not in this team' });

    if (team.leaderId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Leaders cannot leave — cancel the team instead'
      });
    }
    if (team.status !== TEAM_STATUS.FORMING) {
      return res.status(400).json({ success: false, message: 'Cannot leave a completed team' });
    }

    team.members = team.members.filter(m => m.userId.toString() !== userId);
    await team.save();

    res.status(200).json({ success: true, message: 'Left the team' });
  } catch (err) {
    console.error('leaveTeam error:', err);
    res.status(500).json({ success: false, message: 'Failed to leave team' });
  }
};

// ─── serializer ───────────────────────────────────────────────────────────────

const formatTeam = (team, currentUserId) => {
  const isLeader = team.leaderId.toString() === currentUserId;
  const slotsLeft = team.maxSize - team.members.length;

  return {
    id: team._id,
    name: team.name,
    inviteCode: team.inviteCode,
    maxSize: team.maxSize,
    currentSize: team.members.length,
    slotsLeft,
    status: team.status,
    isLeader,
    event: team.eventId && typeof team.eventId === 'object'
      ? {
          id: team.eventId._id,
          name: team.eventId.name,
          startDate: team.eventId.startDate,
          endDate: team.eventId.endDate,
          registrationDeadline: team.eventId.registrationDeadline
        }
      : { id: team.eventId },
    members: (team.members || []).map(m => {
      const u = m.userId;
      const isPopulated = u && typeof u === 'object' && u._id;
      return {
        userId: isPopulated ? u._id : u,
        name: isPopulated ? `${u.firstName} ${u.lastName}` : null,
        email: isPopulated ? u.email : null,
        participantType: isPopulated ? u.participantType : null,
        isLeader: isPopulated
          ? u._id.toString() === team.leaderId.toString()
          : u.toString() === team.leaderId.toString(),
        joinedAt: m.joinedAt
      };
    }),
    createdAt: team.createdAt
  };
};

module.exports = {
  createTeam,
  joinTeamByCode,
  getMyTeams,
  getTeamDetail,
  cancelTeam,
  leaveTeam
};
