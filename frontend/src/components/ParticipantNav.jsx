import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Grid3x3, Users, User, LogOut, Sparkles, UsersRound } from 'lucide-react';

export const ParticipantNav = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/participant/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/participant/browse-events', icon: Grid3x3,         label: 'Browse Events' },
    { path: '/participant/teams',        icon: UsersRound,      label: 'Teams' },
    { path: '/participant/organizers',   icon: Users,           label: 'Clubs' },
    { path: '/participant/profile',      icon: User,            label: 'Profile' },
  ];

  // Determine title based on current path
  const getTitle = () => {
    if (location.pathname.includes('/organizers/')) return 'Organizer Details';
    if (location.pathname.includes('/events/')) return 'Event Details';
    if (location.pathname.includes('/teams')) return 'My Teams';
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Felicity';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              {getTitle()}
            </h2>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline text-sm">{item.label}</span>
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline text-sm">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
