import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrganizerEvents, createEvent } from '../../api/organizer';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Calendar, MapPin, Users, LogOut, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

function OrganizerEvents() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: 100
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await getOrganizerEvents();
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvent(formData);
      setMessage('Event created successfully!');
      setShowForm(false);
      setFormData({ title: '', description: '', date: '', location: '', capacity: 100 });
      fetchEvents();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create event');
    }
  };

  const isError = message.toLowerCase().includes('failed');

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Manage Events
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/organizer/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
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

      <div className="container mx-auto px-6 py-10 space-y-6">
        {message && (
          <div className={`rounded-xl border px-4 py-3 ${
            isError
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-success/10 text-success border-success/20'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Create a New Event</h3>
              <p className="text-sm text-muted-foreground">Share details and publish your event</p>
            </div>
            <GradientButton
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              <PlusCircle className="w-5 h-5" />
              {showForm ? 'Hide Form' : 'Create New Event'}
            </GradientButton>
          </div>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-foreground mb-4">Event Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  min="1"
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <GradientButton type="submit" variant="accent">
                Create Event
              </GradientButton>
            </form>
          </motion.div>
        )}

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">My Events</h3>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No events yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first event to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pl-3 font-semibold text-muted-foreground text-sm">Title</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Date</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Location</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Capacity</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 pl-3 font-medium text-foreground">{event.title}</td>
                      <td className="py-4 text-foreground">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="py-4 text-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {event.location}
                        </div>
                      </td>
                      <td className="py-4 text-foreground">{event.registrationCount || 0} / {event.capacity}</td>
                      <td className="py-4">
                        <GradientButton
                          size="sm"
                          variant="primary"
                          onClick={() => navigate(`/organizer/attendance/${event._id}`)}
                        >
                          Attendance
                        </GradientButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizerEvents;
