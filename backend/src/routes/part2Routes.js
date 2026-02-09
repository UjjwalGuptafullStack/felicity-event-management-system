/**
 * Part-2 Routes
 * Additional routes for Tier A, B, and C features
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireOrganizer, requireParticipant, requireAdmin } = require('../middleware/authContracts');

// Import controllers
const merchandiseController = require('../controllers/merchandiseController');
const attendanceController = require('../controllers/attendanceController');
const passwordResetController = require('../controllers/passwordResetController');
const discussionController = require('../controllers/discussionController');
const feedbackController = require('../controllers/feedbackController');

// ===== MERCHANDISE ROUTES (Tier A1) =====

// Participant routes
router.post(
  '/participant/events/:id/merchandise/purchase',
  authenticate,
  requireParticipant(),
  merchandiseController.purchaseMerchandise
);

// Organizer routes
router.get(
  '/organizer/merchandise/pending',
  authenticate,
  requireOrganizer(),
  merchandiseController.getPendingPayments
);

router.post(
  '/organizer/merchandise/:regId/approve',
  authenticate,
  requireOrganizer(),
  merchandiseController.approvePayment
);

router.post(
  '/organizer/merchandise/:regId/reject',
  authenticate,
  requireOrganizer(),
  merchandiseController.rejectPayment
);

// ===== ATTENDANCE ROUTES (Tier A2) =====

router.post(
  '/organizer/events/:id/attendance/scan',
  authenticate,
  requireOrganizer(),
  attendanceController.scanQRCode
);

router.post(
  '/organizer/events/:id/attendance/manual',
  authenticate,
  requireOrganizer(),
  attendanceController.manualAttendance
);

router.get(
  '/organizer/events/:id/attendance',
  authenticate,
  requireOrganizer(),
  attendanceController.getAttendanceList
);

router.get(
  '/organizer/events/:id/attendance/export',
  authenticate,
  requireOrganizer(),
  attendanceController.exportAttendance
);

// ===== PASSWORD RESET ROUTES (Tier B1) =====

// Organizer routes
router.post(
  '/organizer/password-reset/request',
  authenticate,
  requireOrganizer(),
  passwordResetController.submitResetRequest
);

router.get(
  '/organizer/password-reset/my-requests',
  authenticate,
  requireOrganizer(),
  passwordResetController.getOwnResetRequests
);

// Admin routes
router.get(
  '/admin/password-reset/requests',
  authenticate,
  requireAdmin(),
  passwordResetController.getResetRequests
);

router.post(
  '/admin/password-reset/:id/approve',
  authenticate,
  requireAdmin(),
  passwordResetController.approveResetRequest
);

router.post(
  '/admin/password-reset/:id/reject',
  authenticate,
  requireAdmin(),
  passwordResetController.rejectResetRequest
);

// ===== DISCUSSION FORUM ROUTES (Tier B2) =====

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

// Organizer-only routes
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

// ===== FEEDBACK ROUTES (Tier C1) =====

// Participant routes
router.post(
  '/participant/events/:id/feedback',
  authenticate,
  requireParticipant(),
  feedbackController.submitFeedback
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

module.exports = router;
