/**
 * Merchandise Routes
 * Participant purchase flow + organizer payment approval workflow
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireOrganizer, requireParticipant } = require('../middleware/authContracts');
const merchandiseController = require('../controllers/merchandiseController');

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

module.exports = router;
