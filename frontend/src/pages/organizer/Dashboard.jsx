import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrganizerEvents, getOrganizerStats } from '../../api/organizer';
import { StatsCard } from '../../components/design-system/StatsCard';
import { EventCard } from '../../components/design-system/EventCard';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Calendar, Users, DollarSign, Sparkles, PackageCheck, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

function OrganizerDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, statsRes] = await Promise.all([
          getOrganizerEvents(),
          getOrganizerStats()
        ]);
        setEvents(eventsRes.data.events || []);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching organizer data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organizer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Organizer Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/organizer/events')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Manage Events</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/organizer/merchandise-approvals')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Merch Approvals</span>
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <StatsCard
            title="Total Events"
            value={stats?.totalEvents || 0}
            icon={Calendar}
            gradient="primary"
            change="All time"
            changeType="neutral"
          />
          <StatsCard
            title="Total Registrations"
            value={stats?.totalRegistrations || 0}
            icon={Users}
            gradient="secondary"
            change="Across events"
            changeType="neutral"
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${stats?.totalRevenue || 0}`}
            icon={DollarSign}
            gradient="accent"
            change="Gross sales"
            changeType="neutral"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">My Events</h3>
            <GradientButton
              variant="primary"
              size="sm"
              onClick={() => navigate('/organizer/events')}
            >
              Manage Events
            </GradientButton>
          </div>

          {events.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No events created yet</p>
              <GradientButton variant="accent" onClick={() => navigate('/organizer/events')}>
                Create Your First Event
              </GradientButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <EventCard
                    title={event.title}
                    date={new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    time={event.time || 'TBA'}
                    location={event.location}
                    category={event.category || 'Event'}
                    attendees={event.registrationCount || 0}
                    image={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop'}
                    onClick={() => navigate(`/organizer/attendance/${event._id}`)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
