import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../api/admin';
import { StatsCard } from '../../components/design-system/StatsCard';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Users, UserCog, Calendar, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Admin Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/password-resets')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">Password Resets</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/organizers')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
            >
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Manage Organizers</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            gradient="primary"
            change="Registered"
            changeType="neutral"
          />
          <StatsCard
            title="Total Organizers"
            value={stats?.totalOrganizers || 0}
            icon={UserCog}
            gradient="secondary"
            change="Active"
            changeType="neutral"
          />
          <StatsCard
            title="Total Events"
            value={stats?.totalEvents || 0}
            icon={Calendar}
            gradient="accent"
            change="Platform-wide"
            changeType="neutral"
          />
          <StatsCard
            title="Pending Resets"
            value={stats?.pendingPasswordResets || 0}
            icon={KeyRound}
            gradient="primary"
            change="Needs review"
            changeType="neutral"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <GradientButton variant="primary" onClick={() => navigate('/admin/password-resets')}>
              Review Password Reset Requests
            </GradientButton>
            <GradientButton variant="secondary" onClick={() => navigate('/admin/organizers')}>
              Manage Organizers
            </GradientButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminDashboard;
