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
const {
  createOrganizer,
  listOrganizers,
  getOrganizer,
  disableOrganizer,
  enableOrganizer,
  getAdminDashboard
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin());

// Dashboard route
router.get('/dashboard', getAdminDashboard);

// Organizer management routes
router.post('/organizers', createOrganizer);
router.get('/organizers', listOrganizers);
router.get('/organizers/:id', getOrganizer);
router.patch('/organizers/:id/disable', disableOrganizer);
router.patch('/organizers/:id/enable', enableOrganizer);

module.exports = router;
