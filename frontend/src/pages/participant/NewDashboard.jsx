import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRegistrations } from '../../api/participant';
import { StatsCard } from '../../components/design-system/StatsCard';
import { Calendar, Ticket, ShoppingBag, Clock, CheckCircle, XCircle, Tag, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  registered:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  team_forming: 'bg-yellow-500/10  text-yellow-400  border border-yellow-500/20',
  cancelled:    'bg-red-500/10    text-red-400    border border-red-500/20',
  rejected:     'bg-orange-500/10 text-orange-300  border border-orange-500/20',
  pending:      'bg-yellow-500/10 text-yellow-300  border border-yellow-500/20',
};

const TYPE_STYLES = {
  normal:      'bg-blue-500/10   text-blue-400   border border-blue-500/20',
  merchandise: 'bg-purple-500/10 text-purple-400  border border-purple-500/20',
  hackathon:   'bg-pink-500/10   text-pink-400    border border-pink-500/20',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Registration Card ───────────────────────────────────────────────────────

function RegCard({ reg, navigate }) {
  const { event, ticket, registrationStatus, registrationType, registeredAt, teamName } = reg;
  if (!event) return null;

  const now = new Date();
  const isPast = event.endDate && new Date(event.endDate) < now;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-accent/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/participant/events/${event.id}`)}
    >
      {/* Top row: name + badges */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-emerald-50 leading-tight">{event.name}</h3>
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_STYLES[event.type] || TYPE_STYLES.normal}`}>
            {event.type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[registrationStatus] || ''}`}>
            {registrationStatus === 'team_forming' ? 'Team Forming' : registrationStatus}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {event.organizer && (
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {event.organizer.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {fmt(event.startDate)}
          {event.endDate && <> – {fmt(event.endDate)}</>}
        </span>
        {teamName && (
          <span className="flex items-center gap-1 text-accent">
            <Users className="w-3.5 h-3.5" />
            Team: {teamName}
          </span>
        )}
      </div>

      {/* Ticket chip */}
      {ticket?.ticketId && (
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-accent flex-shrink-0" />
          <span className="font-mono text-sm bg-emerald-500/10 text-accent px-3 py-1 rounded-lg border border-emerald-500/20 tracking-wider select-all">
            {ticket.ticketId}
          </span>
          {isPast && (
            <span className="text-xs text-muted-foreground">issued {fmt(ticket.issuedAt)}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function Empty({ message }) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

function ParticipantDashboard() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    getMyRegistrations()
      .then(res => setRegistrations(res.data.registrations || []))
      .catch(err => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  // ── classify ──────────────────────────────────────────────────────────────
  const now = new Date();

  const upcoming = registrations.filter(r =>
    r.registrationStatus === 'registered' &&
    r.event?.startDate && new Date(r.event.startDate) > now
  );

  const normal = registrations.filter(r =>
    r.registrationType !== 'merchandise'
  );

  const merchandise = registrations.filter(r =>
    r.registrationType === 'merchandise'
  );

  const completed = registrations.filter(r =>
    r.registrationStatus === 'registered' &&
    r.event?.endDate && new Date(r.event.endDate) < now
  );

  const cancelled = registrations.filter(r =>
    ['cancelled', 'rejected'].includes(r.registrationStatus)
  );

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { title: 'Total Registrations', value: registrations.length, icon: Calendar },
    { title: 'Upcoming Events',     value: upcoming.length,       icon: Clock },
    { title: 'Completed Events',    value: completed.length,      icon: CheckCircle },
    { title: 'Merchandise',         value: merchandise.length,    icon: ShoppingBag },
  ];

  // ── tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'upcoming',     label: 'Upcoming',     icon: Clock,        data: upcoming },
    { id: 'normal',       label: 'Normal Events', icon: Ticket,       data: normal },
    { id: 'merchandise',  label: 'Merchandise',   icon: ShoppingBag,  data: merchandise },
    { id: 'completed',    label: 'Completed',     icon: CheckCircle,  data: completed },
    { id: 'cancelled',    label: 'Cancelled',     icon: XCircle,      data: cancelled },
  ];

  const activeData = tabs.find(t => t.id === activeTab)?.data ?? [];

  const emptyMessages = {
    upcoming:    'No upcoming events registered.',
    normal:      'No normal event registrations yet.',
    merchandise: 'No merchandise purchases yet.',
    completed:   'No completed events yet.',
    cancelled:   'No cancelled or rejected registrations.',
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map(s => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} />
        ))}
      </motion.div>

      {/* Tabs panel */}
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">

        {/* Tab bar */}
        <div className="flex flex-wrap border-b border-border overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 flex items-center gap-2 text-sm whitespace-nowrap transition-colors
                  ${active
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-muted-foreground hover:text-foreground-secondary'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full
                  ${active ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {tab.data.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {activeData.length === 0
                ? <Empty message={emptyMessages[activeTab]} />
                : activeData.map(reg => (
                    <RegCard key={reg.registrationId} reg={reg} navigate={navigate} />
                  ))
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ParticipantDashboard;
