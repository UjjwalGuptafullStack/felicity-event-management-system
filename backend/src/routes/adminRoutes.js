/**
 * Admin Routes
 * 
 * All routes in this file require admin authentication
 * Middleware chain: authenticate → requireAdmin
 * 
 * Protected operations:
 * - Organizer provisioning (create)
 * - Organizer management (disable/enable, list)
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authContracts');
const validate = require('../middleware/validate');
const { createOrganizerSchema } = require('../validation/schemas');
const {
  createOrganizer,
  listOrganizers,
  getOrganizer,
  disableOrganizer,
  enableOrganizer,
  deleteOrganizer,
  resetOrganizerPassword,
  getAdminStats,
  getAdminDashboard
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin());

// Dashboard and stats routes
router.get('/dashboard', getAdminDashboard);
router.get('/stats', getAdminStats);

// Organizer management routes
router.post('/organizers', validate(createOrganizerSchema), createOrganizer);
router.get('/organizers', listOrganizers);
router.get('/organizers/:id', getOrganizer);
router.patch('/organizers/:id/disable', disableOrganizer);
router.patch('/organizers/:id/enable', enableOrganizer);
router.delete('/organizers/:id', deleteOrganizer);
router.post('/organizers/:id/reset-password', resetOrganizerPassword);

module.exports = router;
