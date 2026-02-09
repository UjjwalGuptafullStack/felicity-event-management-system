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
  loginOrganizer
} = require('../controllers/authController');

// Participant routes
router.post('/participant/register', registerParticipant);
router.post('/participant/login', loginParticipant);

// Admin routes
router.post('/admin/login', loginAdmin);

// Organizer routes
router.post('/organizer/login', loginOrganizer);

module.exports = router;
