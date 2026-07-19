import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useClickOutside } from '../hooks/useClickOutside';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const handleClickNotification = (n) => {
    const id = n.id || n._id;
    if (!n.read) markAsRead(id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center p-2 sm:p-2.5 rounded-lg bg-muted/40 text-foreground hover:bg-muted/70 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-popover border border-border rounded-xl shadow-2xl z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-light transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id || n._id}>
                    <button
                      onClick={() => handleClickNotification(n)}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/20 transition-colors ${
                        !n.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        <div className={n.read ? 'pl-3.5' : ''}>
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
