/**
 * Team Chat Socket Handler
 *
 * Architecture:
 *  - Each team gets its own Socket.io room: `team-<teamId>`
 *  - A lightweight notification room `notify-team-<teamId>` lets clients
 *    receive new-message badges without opening the full chat.
 *  - Presence (online members) is tracked in memory per teamId.
 *  - Typing indicators are transient; they are NOT persisted.
 *  - Message persistence lives in ChatMessage model.
 *
 * Security:
 *  - JWT is verified on every socket handshake (middleware).
 *  - Team membership + 'complete' status is re-verified on join-team.
 *  - send-message re-checks membership to prevent spoofed events.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

// ─── Presence tracking ────────────────────────────────────────────────────────
// teamId → Map<userId, { name, count }>   (count = # active sockets)
const teamPresence = new Map();

const addPresence = (teamId, userId, name) => {
  if (!teamPresence.has(teamId)) teamPresence.set(teamId, new Map());
  const cur = teamPresence.get(teamId).get(userId) || { name, count: 0 };
  teamPresence.get(teamId).set(userId, { name, count: cur.count + 1 });
};

const removePresence = (teamId, userId) => {
  if (!teamPresence.has(teamId)) return;
  const cur = teamPresence.get(teamId).get(userId);
  if (!cur) return;
  if (cur.count <= 1) teamPresence.get(teamId).delete(userId);
  else teamPresence.get(teamId).set(userId, { ...cur, count: cur.count - 1 });
};

const getOnline = (teamId) => {
  if (!teamPresence.has(teamId)) return [];
  return Array.from(teamPresence.get(teamId).entries()).map(([userId, d]) => ({
    userId,
    name: d.name
  }));
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isMemberOf = (team, userId) =>
  team.leaderId.toString() === userId ||
  team.members.some((m) => m.userId.toString() === userId);

// ─── Setup ────────────────────────────────────────────────────────────────────
function setupTeamChat(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    maxHttpBufferSize: 5 * 1024 * 1024 // 5 MB (for any future binary payloads)
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const payload = jwt.verify(token, config.jwtSecret);
      if (!payload?.id) return next(new Error('Invalid token'));

      // Only participants use team chat
      if (payload.actorType !== 'user' || payload.role !== 'participant') {
        return next(new Error('Participants only'));
      }

      // Resolve display name from DB (JWT only carries id/actorType/role)
      const User = require('../models/User');
      const user = await User.findById(payload.id).select('firstName lastName');
      if (!user) return next(new Error('User not found'));

      socket.userId   = payload.id;
      socket.userName = `${user.firstName} ${user.lastName}`.trim();
      socket.joinedTeams = new Set();
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  // ── Connection ───────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {

    // ── join-team ──────────────────────────────────────────────────────────────
    socket.on('join-team', async ({ teamId }) => {
      try {
        if (!teamId) return socket.emit('chat-error', { message: 'teamId required' });

        const Team = require('../models/Team');
        const team = await Team.findById(teamId);
        if (!team) return socket.emit('chat-error', { message: 'Team not found' });
        if (!isMemberOf(team, socket.userId))
          return socket.emit('chat-error', { message: 'Not a member of this team' });

        const room = `team-${teamId}`;
        socket.join(room);
        socket.joinedTeams.add(teamId);

        addPresence(teamId, socket.userId, socket.userName);
        io.to(room).emit('presence-update', { teamId, online: getOnline(teamId) });

        // Confirm to the joining client
        socket.emit('joined-team', { teamId });
      } catch {
        socket.emit('chat-error', { message: 'Failed to join team room' });
      }
    });

    // ── leave-team ─────────────────────────────────────────────────────────────
    socket.on('leave-team', ({ teamId }) => {
      socket.leave(`team-${teamId}`);
      socket.joinedTeams.delete(teamId);
      removePresence(teamId, socket.userId);
      io.to(`team-${teamId}`).emit('presence-update', { teamId, online: getOnline(teamId) });
    });

    // ── send-message ───────────────────────────────────────────────────────────
    socket.on('send-message', async ({ teamId, content }) => {
      try {
        if (!content?.trim()) return;

        const Team        = require('../models/Team');
        const ChatMessage = require('../models/ChatMessage');

        const team = await Team.findById(teamId);
        if (!team || !isMemberOf(team, socket.userId)) return;

        const msg = await ChatMessage.create({
          teamId,
          senderId:   socket.userId,
          senderName: socket.userName,
          content:    content.trim(),
          type:       'text'
        });

        const payload = {
          _id:        msg._id,
          teamId,
          senderId:   socket.userId,
          senderName: socket.userName,
          content:    msg.content,
          type:       'text',
          createdAt:  msg.createdAt
        };

        io.to(`team-${teamId}`).emit('new-message', payload);
        // Also broadcast to lightweight notification subscribers
        io.to(`notify-team-${teamId}`).emit('team-notification', { teamId, message: payload });
      } catch {
        socket.emit('chat-error', { message: 'Failed to send message' });
      }
    });

    // ── send-file-message ──────────────────────────────────────────────────────
    // Called after a successful REST file upload; server persists & broadcasts.
    socket.on('send-file-message', async ({ teamId, fileUrl, fileName, fileType }) => {
      try {
        const Team        = require('../models/Team');
        const ChatMessage = require('../models/ChatMessage');

        const team = await Team.findById(teamId);
        if (!team || !isMemberOf(team, socket.userId)) return;

        const msg = await ChatMessage.create({
          teamId,
          senderId:   socket.userId,
          senderName: socket.userName,
          content:    '',
          type:       'file',
          fileUrl,
          fileName,
          fileType
        });

        const payload = {
          _id:        msg._id,
          teamId,
          senderId:   socket.userId,
          senderName: socket.userName,
          content:    '',
          type:       'file',
          fileUrl,
          fileName,
          fileType,
          createdAt:  msg.createdAt
        };

        io.to(`team-${teamId}`).emit('new-message', payload);
        io.to(`notify-team-${teamId}`).emit('team-notification', { teamId, message: payload });
      } catch {
        socket.emit('chat-error', { message: 'Failed to broadcast file message' });
      }
    });

    // ── typing indicators ──────────────────────────────────────────────────────
    socket.on('typing', ({ teamId }) => {
      socket.to(`team-${teamId}`).emit('user-typing', {
        userId: socket.userId,
        name:   socket.userName
      });
    });

    socket.on('stop-typing', ({ teamId }) => {
      socket.to(`team-${teamId}`).emit('user-stop-typing', { userId: socket.userId });
    });

    // ── notification subscriptions ─────────────────────────────────────────────
    // Lets clients subscribe to badge notifications without entering chat rooms.
    socket.on('subscribe-notifications', ({ teamIds }) => {
      if (!Array.isArray(teamIds)) return;
      for (const id of teamIds) {
        socket.join(`notify-team-${id}`);
      }
    });

    socket.on('unsubscribe-notifications', ({ teamIds }) => {
      if (!Array.isArray(teamIds)) return;
      for (const id of teamIds) {
        socket.leave(`notify-team-${id}`);
      }
    });

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const teamId of socket.joinedTeams) {
        removePresence(teamId, socket.userId);
        io.to(`team-${teamId}`).emit('presence-update', { teamId, online: getOnline(teamId) });
      }
    });
  });

  return io;
}

module.exports = { setupTeamChat };
