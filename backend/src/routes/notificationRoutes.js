/**
 * Notification Routes
 * Available to any authenticated actor — scoped to "my own notifications" only.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authContracts');
const { listNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.use(authenticate);

router.get('/notifications', listNotifications);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);

module.exports = router;
