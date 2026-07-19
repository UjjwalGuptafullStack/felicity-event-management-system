/**
 * Discussion Forum Routes
 * Per-event discussion thread, shared by participants and organizers,
 * with organizer-only moderation actions
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireOrganizer } = require('../middleware/authContracts');
const discussionController = require('../controllers/discussionController');

// Routes accessible by both participants and organizers
router.post(
  '/events/:id/discussion/messages',
  authenticate,
  discussionController.postMessage
);

router.get(
  '/events/:id/discussion/messages',
  authenticate,
  discussionController.getMessages
);

// Organizer-only moderation routes
router.post(
  '/organizer/events/:id/discussion/messages/:messageId/pin',
  authenticate,
  requireOrganizer(),
  discussionController.pinMessage
);

router.post(
  '/organizer/events/:id/discussion/messages/:messageId/unpin',
  authenticate,
  requireOrganizer(),
  discussionController.unpinMessage
);

router.delete(
  '/organizer/events/:id/discussion/messages/:messageId',
  authenticate,
  requireOrganizer(),
  discussionController.deleteMessage
);

router.post(
  '/organizer/events/:id/discussion/announcement',
  authenticate,
  requireOrganizer(),
  discussionController.postAnnouncement
);

module.exports = router;
