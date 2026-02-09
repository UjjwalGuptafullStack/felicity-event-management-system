/**
 * Participant Routes
 * 
 * Event browsing, registration, and profile routes for participants
 * All routes require participant authentication
 * 
 * Middleware chain: authenticate → requireParticipant
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireParticipant } = require('../middleware/authContracts');
const {
  browseEvents,
  getEventDetails,
  registerForEvent,
  purchaseMerchandise,
  getMyRegistrations,
  getParticipantDashboard
} = require('../controllers/participantEventController');
const {
  getProfile,
  updateProfile,
  followOrganizer,
  unfollowOrganizer
} = require('../controllers/userController');
const {
  listOrganizers,
  getOrganizerDetails
} = require('../controllers/organizerDiscoveryController');

// All participant routes require authentication + participant role
router.use(authenticate);
router.use(requireParticipant());

// Profile routes
router.get('/me/profile', getProfile);
router.patch('/me/profile', updateProfile);

// Dashboard route
router.get('/me/dashboard', getParticipantDashboard);

// Event browsing routes (read-only)
router.get('/events', browseEvents);
router.get('/events/:id', getEventDetails);

// Registration routes
router.post('/events/:id/register', registerForEvent);
router.post('/events/:id/purchase', purchaseMerchandise);
router.get('/me/registrations', getMyRegistrations);

// Organizer discovery routes
router.get('/organizers', listOrganizers);
router.get('/organizers/:id', getOrganizerDetails);

// Organizer follow routes
router.post('/organizers/:id/follow', followOrganizer);
router.post('/organizers/:id/unfollow', unfollowOrganizer);

module.exports = router;
