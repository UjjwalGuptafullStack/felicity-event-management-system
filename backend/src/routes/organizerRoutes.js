/**
 * Organizer Routes
 * 
 * Event management routes for organizers
 * All routes require organizer authentication
 * 
 * Middleware chain: authenticate → requireOrganizer
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireOrganizer } = require('../middleware/authContracts');
const {
  createEvent,
  listOwnEvents,
  getOwnEvent,
  updateEvent,
  publishEvent,
  viewEventRegistrations,
  closeEventRegistrations,
  getEventAnalytics,
  getOrganizerDashboard
} = require('../controllers/eventController');
const {
  getOrganizerProfile,
  updateOrganizerProfile,
} = require('../controllers/organizerProfileController');

// All organizer routes require authentication + organizer role
router.use(authenticate);
router.use(requireOrganizer());

// Profile routes
router.get('/profile', getOrganizerProfile);
router.patch('/profile', updateOrganizerProfile);

// Dashboard route
router.get('/dashboard', getOrganizerDashboard);

// Event management routes
router.post('/events', createEvent);
router.get('/events', listOwnEvents);
router.get('/events/:id', getOwnEvent);
router.patch('/events/:id', updateEvent);
router.post('/events/:id/publish', publishEvent);

// Registration view routes (read-only)
router.get('/events/:id/registrations', viewEventRegistrations);

// Analytics and event control
router.get('/events/:id/analytics', getEventAnalytics);
router.post('/events/:id/close-registrations', closeEventRegistrations);

module.exports = router;
