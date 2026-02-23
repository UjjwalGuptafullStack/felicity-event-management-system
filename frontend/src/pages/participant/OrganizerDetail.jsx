import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrganizerDetails, followOrganizer, unfollowOrganizer } from '../../api/participant';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Users, Mail, Tag, Heart, Calendar, ArrowLeft, Radio, Clock, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'motion/react';

const CATEGORY_LABELS = {
  tech: 'Technology & Coding',
  sports: 'Sports & Fitness',
  cultural: 'Cultural & Arts',
  music: 'Music',
  dance: 'Dance',
  literature: 'Literature & Quiz',
  gaming: 'Gaming',
  science: 'Science & Research',
  entrepreneurship: 'Entrepreneurship',
  design: 'Design & Creativity',
  photography: 'Photography & Film',
  social: 'Social & Community',
};

const TABS = [
  {
    key: 'open',
    label: 'Registration Open',
    icon: Calendar,
    color: 'text-green-500',
    activeBg: 'bg-green-500/10 text-green-600 border-green-500/30',
    badge: 'bg-green-500',
  },
  {
    key: 'live',
    label: 'Live Now',
    icon: Radio,
    color: 'text-red-500',
    activeBg: 'bg-red-500/10 text-red-600 border-red-500/30',
    badge: 'bg-red-500',
  },
  {
    key: 'closed',
    label: 'Registration Closed',
    icon: Lock,
    color: 'text-amber-500',
    activeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    badge: 'bg-amber-500',
  },
  {
    key: 'finished',
    label: 'Finished',
    icon: CheckCircle2,
    color: 'text-muted-foreground',
    activeBg: 'bg-muted/50 text-foreground border-border',
    badge: 'bg-muted-foreground',
  },
];

function categoriseEvents(events) {
  const now = new Date();
  const open = [];
  const live = [];
  const closed = [];
  const finished = [];

  for (const e of events) {
    const start = e.startDate ? new Date(e.startDate) : null;
    const end = e.endDate ? new Date(e.endDate) : null;
    const regDeadline = e.registrationDeadline ? new Date(e.registrationDeadline) : null;

    if (end && end < now) {
      finished.push(e);
    } else if (start && start <= now && (!end || end >= now)) {
      live.push(e);
    } else if (start && start > now) {
      if (regDeadline && regDeadline > now) {
        open.push(e);
      } else {
        closed.push(e);
      }
    } else {
      // fallback: no startDate
      if (regDeadline && regDeadline > now) {
        open.push(e);
      } else {
        finished.push(e);
      }
    }
  }

  return { open, live, closed, finished };
}

function EventRow({ event, idx, onClick }) {
  const now = new Date();
  const regDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const regOpen = regDeadline && regDeadline > now;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-all group"
    >
      {/* Colour dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        idx % 4 === 0 ? 'bg-primary' :
        idx % 4 === 1 ? 'bg-secondary' :
        idx % 4 === 2 ? 'bg-accent' : 'bg-primary-light'
      }`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {event.name}
        </h4>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
          {event.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {regDeadline && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Reg. deadline: {regDeadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {event.registrationFee > 0 && (
            <span>₹{event.registrationFee}</span>
          )}
          {event.type === 'merchandise' && (
            <span className="px-1.5 py-0.5 bg-secondary/10 text-secondary rounded text-[10px] font-medium">Merch</span>
          )}
        </div>
        {event.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {event.categories.slice(0, 3).map(c => (
              <span key={c} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                {CATEGORY_LABELS[c] || c}
              </span>
            ))}
          </div>
        )}
      </div>
      {regOpen && (
        <span className="text-[10px] font-semibold px-2 py-1 bg-green-500/10 text-green-600 rounded-full whitespace-nowrap">
          Register Now
        </span>
      )}
    </motion.div>
  );
}

function OrganizerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('open');

  useEffect(() => {
    fetchOrganizerDetails();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      const response = await getOrganizerDetails(id);
      const org = response.data.organizer;
      setOrganizer(org);
      setIsFollowing(org?.isFollowed || false);

      // Backend returns events as a flat array (or legacy { upcoming, past })
      const evData = response.data.events;
      if (Array.isArray(evData)) {
        setEvents(evData);
      } else if (evData && typeof evData === 'object') {
        setEvents([...(evData.upcoming || []), ...(evData.past || [])]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowOrganizer(id);
        setIsFollowing(false);
      } else {
        await followOrganizer(id);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organizer...</p>
        </div>
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-4">Organizer not found</p>
          <GradientButton onClick={() => navigate('/participant/organizers')}>
            Back to Organizers
          </GradientButton>
        </div>
      </div>
    );
  }

  const categorised = categoriseEvents(events);

  // Auto-switch to a non-empty tab on load after events arrive
  const firstNonEmptyTab = TABS.find(t => categorised[t.key].length > 0)?.key || 'open';
  const displayTab = categorised[activeTab] ? activeTab : firstNonEmptyTab;
  const currentEvents = categorised[displayTab] || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-5xl">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/participant/organizers')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Organizers</span>
      </motion.button>

      {/* Organizer card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden mb-8"
      >
        <div className="h-40 bg-gradient-to-br from-primary to-primary-light relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Users className="w-64 h-64 absolute -bottom-16 -right-16 text-white" />
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {organizer.name}
              </h1>
              {organizer.category && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{organizer.category}</span>
                </div>
              )}
              {organizer.description && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                  {organizer.description}
                </p>
              )}
              {organizer.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${organizer.contactEmail}`} className="hover:text-primary transition-colors">
                    {organizer.contactEmail}
                  </a>
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleFollow}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap text-sm ${
                isFollowing
                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
              {isFollowing ? 'Unfollow' : 'Follow'}
            </motion.button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            {TABS.map(tab => (
              <div key={tab.key} className="text-center">
                <div className="text-lg font-bold text-foreground">{categorised[tab.key].length}</div>
                <div className="text-[11px] text-muted-foreground">{tab.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Events section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Events
        </h2>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const count = categorised[tab.key].length;
            const isActive = displayTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  isActive
                    ? tab.activeBg
                    : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? '' : tab.color}`} />
                {tab.label}
                <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-current/10' : 'bg-muted'
                } text-inherit`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Event list */}
        {currentEvents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No {TABS.find(t => t.key === displayTab)?.label.toLowerCase()} events
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentEvents.map((event, idx) => (
              <EventRow
                key={event._id || event.id}
                event={event}
                idx={idx}
                onClick={() => navigate(`/participant/events/${event._id || event.id}`)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default OrganizerDetail;
