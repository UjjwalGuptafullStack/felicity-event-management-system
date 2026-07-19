/**
 * Creates a persisted notification and pushes it live over Socket.io if the
 * recipient has an open connection. Fire-and-forget from callers' point of
 * view — failures are logged, never thrown, matching the rest of the app's
 * non-blocking side-effect pattern (emails, etc).
 */
const Notification = require('../models/Notification');
const { emitNotificationToActor } = require('../sockets/teamChat');

const notify = async ({ recipientType, recipientId, type, title, message, link }) => {
  try {
    const notification = await Notification.create({ recipientType, recipientId, type, title, message, link });

    emitNotificationToActor(recipientType, recipientId, {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: false,
      createdAt: notification.createdAt
    });

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

module.exports = { notify };
