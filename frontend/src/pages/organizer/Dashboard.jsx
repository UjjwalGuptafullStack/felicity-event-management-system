import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizerDashboard } from '../../api/organizer';
import { StatsCard } from '../../components/design-system/StatsCard';
import { EventCard } from '../../components/design-system/EventCard';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Calendar, Users, DollarSign, Sparkles, PackageCheck, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

function OrganizerDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getOrganizerDashboard();
        setEvents(res.data.events || []);
        setStats(res.data.summary || {});
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const eventsByStatus = {
    draft: events.filter(e => e.status === 'draft'),
    published: events.filter(e => e.status === 'published'),
    ongoing: events.filter(e => e.status === 'ongoing'),
    closed: events.filter(e => e.status === 'closed')
  };

  return (
    <div className="container mx-auto px-6 py-10 space-y-8">
      {/* Stats Cards - Event Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <StatsCard
          title="Total Events"
          value={stats?.totalEvents || 0}
          icon={Calendar}
          gradient="primary"
          change={`${eventsByStatus.published.length} published`}
          changeType="neutral"
        />
        <StatsCard
          title="Total Registrations"
          value={stats?.totalRegistrations || 0}
          icon={Users}
          gradient="secondary"
          change="Across all events"
          changeType="neutral"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats?.totalRevenue || 0}`}
          icon={DollarSign}
          gradient="accent"
          change="Gross sales"
          changeType="positive"
        />
        <StatsCard
          title="Completed Events"
          value={eventsByStatus.closed.length}
          icon={CheckCircle}
          gradient="success"
          change={`${eventsByStatus.ongoing.length} ongoing`}
          changeType="neutral"
        />
      </motion.div>

      {/* Events Carousel */}
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
            Create Event
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
                <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                     onClick={() => navigate(`/organizer/events/${event.id}/detail`)}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold text-foreground">{event.name}</h4>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      event.status === 'draft' ? 'bg-muted text-muted-foreground' :
                      event.status === 'published' ? 'bg-primary/10 text-primary' :
                      event.status === 'ongoing' ? 'bg-accent/10 text-accent' :
                      'bg-success/10 text-success'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{event.type}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                    <span className="text-primary font-semibold">
                      {event.stats?.registrations ?? 0} registered
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default OrganizerDashboard;
