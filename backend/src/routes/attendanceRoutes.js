/**
 * Attendance Routes
 * QR / manual check-in scanning and attendance records, organizer-only
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireOrganizer } = require('../middleware/authContracts');
const attendanceController = require('../controllers/attendanceController');

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

module.exports = router;
