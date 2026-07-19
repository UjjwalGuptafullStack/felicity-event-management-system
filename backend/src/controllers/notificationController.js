/**
 * Notification Controller
 * List/mark-read endpoints for the in-app notification center.
 * Available to any authenticated actor (participant, organizer, or admin) —
 * req.actor.actorType/req.actor.id scope every query to "my own notifications".
 */
const Notification = require('../models/Notification');

/**
 * List the current actor's notifications, most recent first.
 * GET /notifications?page=1&limit=20
 */
const listNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const filter = { recipientType: req.actor.actorType, recipientId: req.actor.id };

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({ ...filter, read: false }),
      Notification.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      total,
      page,
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications' });
  }
};

/**
 * Mark a single notification as read.
 * PATCH /notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientType: req.actor.actorType, recipientId: req.actor.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

/**
 * Mark all of the current actor's notifications as read.
 * PATCH /notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientType: req.actor.actorType, recipientId: req.actor.id, read: false },
      { read: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead
};
