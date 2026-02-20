/**
 * Chat Controller (REST)
 *
 * GET  /chat/team/:teamId/messages  – load paginated message history
 * POST /chat/team/:teamId/upload    – upload a file attachment (Multer)
 */

const Team        = require('../models/Team');
const ChatMessage = require('../models/ChatMessage');

const isMemberOf = (team, userId) =>
  team.leaderId.toString() === userId ||
  team.members.some((m) => m.userId.toString() === userId);

// ─── GET messages ─────────────────────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { before, limit = '50' } = req.query;
    const userId = req.actor.id;

    const team = await Team.findById(teamId);
    if (!team)
      return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.status !== 'complete')
      return res.status(403).json({ success: false, message: 'Chat only available for complete teams' });
    if (!isMemberOf(team, userId))
      return res.status(403).json({ success: false, message: 'Not a team member' });

    const filter = { teamId };
    if (before) filter._id = { $lt: before };

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
};

// ─── POST upload ──────────────────────────────────────────────────────────────
const uploadFile = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.actor.id;

    const team = await Team.findById(teamId);
    if (!team)
      return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.status !== 'complete')
      return res.status(403).json({ success: false, message: 'Chat only available for complete teams' });
    if (!isMemberOf(team, userId))
      return res.status(403).json({ success: false, message: 'Not a team member' });
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileUrl  = `/uploads/chat/${req.file.filename}`;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;

    res.json({ success: true, fileUrl, fileName, fileType });
  } catch (err) {
    console.error('uploadFile error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};

module.exports = { getMessages, uploadFile };
