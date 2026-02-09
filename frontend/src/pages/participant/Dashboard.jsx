import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyRegistrations, getMyMerchandisePurchases } from '../../api/participant';
import { getAllEvents } from '../../api/events';
import { StatsCard } from '../../components/design-system/StatsCard';
import { EventCard } from '../../components/design-system/EventCard';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Calendar, Ticket, ShoppingBag, LogOut, Grid3x3, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

function ParticipantDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regRes, purchaseRes, eventsRes] = await Promise.all([
          getMyRegistrations(),
          getMyMerchandisePurchases(),
          getAllEvents()
        ]);
        setRegistrations(regRes.data.registrations || []);
        setPurchases(purchaseRes.data.purchases || []);
        const now = new Date();
        setUpcomingEvents((eventsRes.data.events || []).filter(e => new Date(e.date) > now));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              My Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/events')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Events</span>
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
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <StatsCard
            title="Events Registered"
            value={registrations.length}
            icon={Calendar}
            gradient="primary"
            change={registrations.length > 0 ? `${registrations.length} active` : "Get started!"}
            changeType="neutral"
          />
          <StatsCard
            title="Merchandise Orders"
            value={purchases.length}
            icon={ShoppingBag}
            gradient="secondary"
            change={purchases.length > 0 ? `${purchases.length} orders` : "Shop now!"}
            changeType="neutral"
          />
          <StatsCard
            title="Upcoming Events"
            value={upcomingEvents.length}
            icon={Ticket}
            gradient="accent"
            change={upcomingEvents.length > 0 ? `Don't miss out!` : "Check back soon"}
            changeType="neutral"
          />
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">Upcoming Events</h3>
            <GradientButton
              variant="primary"
              size="sm"
              onClick={() => navigate('/events')}
            >
              View All
            </GradientButton>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 sm:p-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground">No upcoming events available</p>
                  <p className="text-sm text-muted-foreground mt-1">Check out what is live this week.</p>
                </div>
                <div className="w-full max-w-[220px]">
                  <GradientButton variant="accent" fullWidth onClick={() => navigate('/events')}>
                    Browse Events
                  </GradientButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.slice(0, 6).map((event, index) => (
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
                    attendees={event.registrations?.length || 0}
                    image={event.image || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop`}
                    onClick={() => navigate(`/events/${event._id}`)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* My Registrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-foreground mb-6">My Registrations</h3>
          {registrations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center py-8">
              <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground">No registrations yet</p>
                <p className="text-sm text-muted-foreground mt-1">Register for events to get started</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pl-3 font-semibold text-muted-foreground text-sm">Event</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Date</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Ticket Type</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => (
                    <tr key={reg._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 pl-3">{reg.event?.title || 'N/A'}</td>
                      <td className="py-4">{reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-4">{reg.ticketType?.name || 'N/A'}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          reg.status === 'confirmed' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* My Merchandise Purchases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-foreground mb-6">My Merchandise Purchases</h3>
          {purchases.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center py-8">
              <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground">No merchandise purchases yet</p>
                <p className="text-sm text-muted-foreground mt-1">Shop for event merchandise</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pl-3 font-semibold text-muted-foreground text-sm">Event</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Item</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Quantity</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Total</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(purchase => (
                    <tr key={purchase._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 pl-3">{purchase.event?.title || 'N/A'}</td>
                      <td className="py-4">{purchase.itemName}</td>
                      <td className="py-4">{purchase.quantity}</td>
                      <td className="py-4 font-medium">₹{purchase.totalAmount}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          purchase.paymentApprovalStatus === 'approved' 
                            ? 'bg-success/10 text-success' 
                            : purchase.paymentApprovalStatus === 'rejected'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {purchase.paymentApprovalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ParticipantDashboard;
