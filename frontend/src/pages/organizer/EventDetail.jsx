import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Tag,
  BadgeCheck,
  AlertCircle,
  FileText,
  Send,
  Loader2,
  User,
  Mail,
  Phone,
  UsersRound,
} from 'lucide-react';
import { getOrganizerEvent, getEventRegistrations, publishEvent } from '../../api/organizer';

const StatusBadge = ({ status }) => {
  const map = {
    draft:     'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    published: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    ongoing:   'bg-blue-500/10   text-blue-400   border border-blue-500/20',
    completed: 'bg-gray-500/10   text-gray-400   border border-gray-500/20',
    cancelled: 'bg-red-500/10    text-red-400    border border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${map[status] || map.draft}`}>
      {status}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-2 rounded-lg bg-muted">
      <Icon className="w-4 h-4 text-accent" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-foreground-secondary font-medium">{value || '—'}</p>
    </div>
  </div>
);

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent]               = useState(null);
  const [registrations, setRegs]        = useState([]);
  const [loading, setLoading]           = useState(true);
  const [regsLoading, setRegsLoading]   = useState(true);
  const [error, setError]               = useState(null);
  const [publishing, setPublishing]     = useState(false);
  const [publishMsg, setPublishMsg]     = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getOrganizerEvent(id);
        setEvent(res.data.event);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    const fetchRegs = async () => {
      try {
        const res = await getEventRegistrations(id);
        setRegs(res.data.registrations || []);
      } catch {
        // registrations not critical — swallow error
      } finally {
        setRegsLoading(false);
      }
    };

    fetchEvent();
    fetchRegs();
  }, [id]);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMsg(null);
    try {
      await publishEvent(id);
      setEvent((prev) => ({ ...prev, status: 'published' }));
      setPublishMsg({ type: 'success', text: 'Event published successfully!' });
    } catch (err) {
      setPublishMsg({ type: 'error', text: err.response?.data?.message || 'Failed to publish event.' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/organizer/events')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={event.status} />
          {/* Scan Attendance button — visible for published/ongoing/completed events */}
          {['published', 'ongoing', 'completed'].includes(event.status) && (
            <button
              onClick={() => navigate(`/organizer/attendance/${id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-semibold transition-colors border border-blue-500/30"
            >
              <BadgeCheck className="w-4 h-4" />
              Scan Attendance
            </button>
          )}
          {event.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish Event
            </button>
          )}
        </div>
      </div>

      {publishMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
            publishMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {publishMsg.type === 'success' ? (
            <BadgeCheck className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {publishMsg.text}
        </div>
      )}

      {/* Event title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground leading-tight">{event.name}</h1>
        {event.type && (
          <p className="text-sm text-muted-foreground mt-1 capitalize">{event.type} event</p>
        )}
      </div>

      {/* Two-column info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-background-secondary border border-border rounded-2xl">
        <InfoRow icon={Calendar} label="Start Date"         value={fmt(event.startDate)} />
        <InfoRow icon={Calendar} label="End Date"           value={fmt(event.endDate)} />
        <InfoRow icon={Clock}    label="Registration Deadline" value={fmt(event.registrationDeadline)} />
        <InfoRow icon={Users}    label="Registration Limit" value={event.registrationLimit ? `${event.registrationLimit} seats` : 'Unlimited'} />
        <InfoRow icon={Tag}      label="Eligibility"        value={event.eligibility} />
        <InfoRow icon={FileText} label="Registration Fee"   value={event.registrationFee ? `₹${event.registrationFee}` : 'Free'} />
      </div>

      {/* Description */}
      {event.description && (
        <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</h2>
          <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Team Registration */}
      {event.teamRegistration?.enabled && (
        <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-3">
          <UsersRound className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-blue-300">Team Registration Enabled</p>
            <p className="text-xs text-blue-400/70">
              Teams of {event.teamRegistration.minSize}–{event.teamRegistration.maxSize} members.
              Tickets are issued automatically when a team is fully formed.
            </p>
          </div>
        </div>
      )}

      {/* Registrations */}
      <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Registrations
          </h2>
          {!regsLoading && (
            <span className="text-xs text-muted-foreground">{registrations.length} total</span>
          )}
        </div>

        {regsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        ) : registrations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No registrations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left py-2 pr-4 font-medium">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Name</span>
                  </th>
                  <th className="text-left py-2 pr-4 font-medium">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                  </th>
                  <th className="text-left py-2 pr-4 font-medium">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</span>
                  </th>
                  <th className="text-left py-2 pr-4 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.registrationId} className="border-b border-muted hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 text-foreground-secondary font-medium">
                      {reg.participant?.name || '—'}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{reg.participant?.email || '—'}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{reg.participant?.contactNumber || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className="capitalize text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                        {reg.participant?.participantType || reg.registrationType || '—'}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{fmt(reg.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
