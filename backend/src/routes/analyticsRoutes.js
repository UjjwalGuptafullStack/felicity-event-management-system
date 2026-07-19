/**
 * Analytics Routes — organizer-only
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireOrganizer } = require('../middleware/authContracts');
const { getOrganizerAnalyticsOverview, exportEventRegistrations } = require('../controllers/analyticsController');

router.get('/organizer/analytics/overview', authenticate, requireOrganizer(), getOrganizerAnalyticsOverview);
router.get('/organizer/events/:id/registrations/export', authenticate, requireOrganizer(), exportEventRegistrations);

module.exports = router;
