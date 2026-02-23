import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOrganizerEvents, createEvent, publishEvent } from '../../api/organizer';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Calendar } from 'lucide-react';
import { motion } from 'motion/react';

function OrganizerEvents() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateMode = location.pathname === '/organizer/events';
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'normal',
    categories: [],
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    registrationLimit: 100,
    registrationFee: 0,
    eligibility: '',
    teamRegistration: { enabled: false, minSize: 2, maxSize: 5 }
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isCreateMode) {
      fetchEvents();
    }
  }, [isCreateMode]);

  const fetchEvents = async () => {
    try {
      const response = await getOrganizerEvents();
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handlePublish = async (eventId) => {
    try {
      await publishEvent(eventId);
      setMessage('Event published successfully!');
      fetchEvents();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to publish event');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvent(formData);
      setMessage('Event created successfully!');
      setFormData({
        name: '',
        description: '',
        type: 'normal',
        categories: [],
        registrationDeadline: '',
        startDate: '',
        endDate: '',
        registrationLimit: 100,
        registrationFee: 0,
        eligibility: '',
        teamRegistration: { enabled: false, minSize: 2, maxSize: 5 }
      });
      setTimeout(() => navigate('/organizer/ongoing-events'), 1200);
    } catch (error) {
      console.error('Create event error:', error);
      setMessage(error.response?.data?.message || 'Failed to create event');
    }
  };

  const isError = message.toLowerCase().includes('failed');

  return (
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

      {isCreateMode ? (
        /* ── Create Event Tab ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">Create a New Event</h3>
            <p className="text-sm text-muted-foreground">Fill in the details and create your event as a draft</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Event Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="normal">Normal Event</option>
                  <option value="merchandise">Merchandise Event</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Eligibility</label>
                <select
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select eligibility...</option>
                  <option value="Open to all">Open to all</option>
                  <option value="IIIT students only">IIIT students only</option>
                  <option value="External participants only">External participants only</option>
                  <option value="Invite only">Invite only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                  required
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Start Date *</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End Date *</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Registration Limit</label>
                <input
                  type="number"
                  value={formData.registrationLimit}
                  onChange={(e) => setFormData({ ...formData, registrationLimit: parseInt(e.target.value) })}
                  placeholder="Max participants"
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Registration Fee (₹)</label>
                <input
                  type="number"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData({ ...formData, registrationFee: parseFloat(e.target.value) })}
                  placeholder="0 for free event"
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Team Registration */}
            <div className="rounded-xl border border-border p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setFormData(f => ({ ...f, teamRegistration: { ...f.teamRegistration, enabled: !f.teamRegistration.enabled } }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${formData.teamRegistration.enabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.teamRegistration.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-foreground">Team Registration (Hackathon)</span>
              </label>
              {formData.teamRegistration.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Min Team Size</label>
                    <input
                      type="number" min={2} max={10}
                      value={formData.teamRegistration.minSize}
                      onChange={e => setFormData(f => ({ ...f, teamRegistration: { ...f.teamRegistration, minSize: parseInt(e.target.value) || 2 } }))}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Max Team Size</label>
                    <input
                      type="number" min={2} max={20}
                      value={formData.teamRegistration.maxSize}
                      onChange={e => setFormData(f => ({ ...f, teamRegistration: { ...f.teamRegistration, maxSize: parseInt(e.target.value) || 5 } }))}
                      className="mt-1 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <GradientButton type="submit" variant="accent">
                Create Event (Draft)
              </GradientButton>
            </div>
          </form>
        </motion.div>
      ) : (
        /* ── Ongoing Events Tab ── */
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">My Events</h3>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No events yet</p>
              <p className="text-sm text-muted-foreground mt-2">Head to "Create Event" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pl-3 font-semibold text-muted-foreground text-sm">Name</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Type</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Status</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Start Date</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Registrations</th>
                    <th className="pb-3 font-semibold text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 pl-3 font-medium text-foreground">{event.name}</td>
                      <td className="py-4 text-foreground capitalize">{event.type}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          event.status === 'draft' ? 'bg-muted text-muted-foreground' :
                          event.status === 'published' ? 'bg-primary/10 text-primary' :
                          event.status === 'ongoing' ? 'bg-accent/10 text-accent' :
                          'bg-success/10 text-success'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-4 text-foreground">{new Date(event.startDate).toLocaleDateString()}</td>
                      <td className="py-4 text-foreground">{event.registrationCount || 0} / {event.registrationLimit || '∞'}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {event.status === 'draft' && (
                            <GradientButton
                              size="sm"
                              variant="accent"
                              onClick={() => handlePublish(event._id || event.id)}
                            >
                              Publish
                            </GradientButton>
                          )}
                          <GradientButton
                            size="sm"
                            variant="primary"
                            onClick={() => navigate(`/organizer/events/${event._id}/detail`)}
                          >
                            View Details
                          </GradientButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganizerEvents;
