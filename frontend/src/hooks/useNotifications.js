import { useCallback, useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import { getSocket } from '../sockets/socket';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications({ limit: 20 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();

    const socket = getSocket();
    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    };
    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
