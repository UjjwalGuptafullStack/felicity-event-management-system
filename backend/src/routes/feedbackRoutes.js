/**
 * Feedback Routes
 * Post-event participant ratings/comments and organizer-facing aggregates
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireOrganizer, requireParticipant } = require('../middleware/authContracts');
const feedbackController = require('../controllers/feedbackController');

// Participant routes
router.post(
  '/participant/events/:id/feedback',
  authenticate,
  requireParticipant(),
  feedbackController.submitFeedback
);

router.get(
  '/participant/events/:id/feedback/my',
  authenticate,
  requireParticipant(),
  feedbackController.getMyFeedback
);

// Organizer routes
router.get(
  '/organizer/events/:id/feedback',
  authenticate,
  requireOrganizer(),
  feedbackController.getEventFeedback
);

router.get(
  '/organizer/events/:id/feedback/stats',
  authenticate,
  requireOrganizer(),
  feedbackController.getFeedbackStats
);

router.get(
  '/organizer/events/:id/feedback/export',
  authenticate,
  requireOrganizer(),
  feedbackController.exportFeedbackCSV
);

module.exports = router;
