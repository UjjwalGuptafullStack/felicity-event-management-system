import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents } from '../../api/events';
import { getProfile } from '../../api/participant';
import { motion } from 'motion/react';
import { Calendar, Tag, Users, Search, Sparkles } from 'lucide-react';

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

function BrowseEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'recommended' | category

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, profileRes] = await Promise.allSettled([
          getAllEvents({ limit: 100 }),
          getProfile(),
        ]);
        if (eventsRes.status === 'fulfilled') {
          setEvents(eventsRes.value.data.events || []);
        }
        if (profileRes.status === 'fulfilled') {
          setUserInterests(profileRes.value.data.user?.preferences?.interests || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sort: matching interests first, then alphabetically
  const sortedEvents = [...events].sort((a, b) => {
    const aMatch = (a.categories || []).some(c => userInterests.includes(c));
    const bMatch = (b.categories || []).some(c => userInterests.includes(c));
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const filteredEvents = sortedEvents.filter(event => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      (event.name || '').toLowerCase().includes(term) ||
      (event.description || '').toLowerCase().includes(term);

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'recommended' &&
        (event.categories || []).some(c => userInterests.includes(c))) ||
      (event.categories || []).includes(activeFilter);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  const hasInterests = userInterests.length > 0;
  const recommendedCount = events.filter(e =>
    (e.categories || []).some(c => userInterests.includes(c))
  ).length;

  const filterTabs = [
    { key: 'all', label: 'All Events' },
    ...(hasInterests ? [{ key: 'recommended', label: `Recommended (${recommendedCount})`, icon: Sparkles }] : []),
    ...Object.keys(CATEGORY_LABELS).map(k => ({ key: k, label: CATEGORY_LABELS[k] })),
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Browse Events</h1>
        {hasInterests && (
          <p className="text-muted-foreground text-sm">
            Events matching your interests are shown first
          </p>
        )}
      </motion.div>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeFilter === tab.key
                ? 'bg-primary text-white border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No events found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event, idx) => {
            const isRecommended = hasInterests && (event.categories || []).some(c => userInterests.includes(c));
            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => navigate(`/participant/events/${event._id}`)}
                className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:-translate-y-1 transition-all group"
              >
                {/* Image / Color header */}
                <div className={`h-36 bg-gradient-to-br relative overflow-hidden ${
                  idx % 4 === 0 ? 'from-primary to-primary-light' :
                  idx % 4 === 1 ? 'from-secondary to-secondary-light' :
                  idx % 4 === 2 ? 'from-accent to-accent-light' :
                  'from-primary-dark to-secondary'
                }`}>
                  {isRecommended && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  )}
                  {event.categories?.length > 0 && (
                    <span className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      {CATEGORY_LABELS[event.categories[0]] || event.categories[0]}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {event.name}
                  </h3>
                  {event.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                  )}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-secondary" />
                      <span>
                        {event.registrationCount || 0}
                        {event.registrationLimit ? ` / ${event.registrationLimit}` : ''} registered
                      </span>
                    </div>
                    {event.eligibility && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-accent" />
                        <span>{event.eligibility}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BrowseEvents;

