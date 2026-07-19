/**
 * Authentication Routes
 * Handles registration and login endpoints for all actor types
 */

const express = require('express');
const router = express.Router();
const {
  registerParticipant,
  loginParticipant,
  loginAdmin,
  loginOrganizer,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const {
  registerParticipantSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validation/schemas');

// Participant routes
router.post('/participant/register', validate(registerParticipantSchema), registerParticipant);
router.post('/participant/login', validate(loginSchema), loginParticipant);

// Admin routes
router.post('/admin/login', validate(loginSchema), loginAdmin);

// Organizer routes
router.post('/organizer/login', validate(loginSchema), loginOrganizer);

// Self-service password reset (participant or organizer)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
