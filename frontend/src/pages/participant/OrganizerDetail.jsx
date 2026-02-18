import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrganizerDetails, followOrganizer, unfollowOrganizer } from '../../api/participant';
import { EventCard } from '../../components/design-system/EventCard';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Users, Mail, Tag, Heart, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

function OrganizerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchOrganizerDetails();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      const response = await getOrganizerDetails(id);
      setOrganizer(response.data.organizer);
      setIsFollowing(response.data.organizer?.isFollowed || false);
    } catch (error) {
      console.error('Error fetching organizer details:', error);
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
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organizer details...</p>
        </div>
      </div>
    );
  }

  if (!organizer) {
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

  const upcomingEvents = organizer.events?.filter(e => new Date(e.date) > new Date()) || [];
  const pastEvents = organizer.events?.filter(e => new Date(e.date) <= new Date()) || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-6xl">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/participant/organizers')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Organizers</span>
      </motion.button>

      {/* Organizer Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden mb-8"
      >
        {/* Banner */}
        <div className="h-48 bg-gradient-to-br from-primary to-primary-light relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Users className="w-64 h-64 absolute -bottom-16 -right-16 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                {organizer.name}
              </h1>
              
              {organizer.category && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Tag className="w-4 h-4" />
                  <span>{organizer.category}</span>
                </div>
              )}

              {organizer.description && (
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {organizer.description}
                </p>
              )}

              {organizer.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a 
                    href={`mailto:${organizer.contactEmail}`}
                    className="hover:text-primary transition-colors"
                  >
                    {organizer.contactEmail}
                  </a>
                </div>
              )}
            </div>

            {/* Follow Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleFollow}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isFollowing
                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
              {isFollowing ? 'Unfollow' : 'Follow'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Events Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          Events
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'past'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Past ({pastEvents.length})
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'upcoming' && upcomingEvents.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No upcoming events</p>
            </div>
          )}
          {activeTab === 'past' && pastEvents.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No past events</p>
            </div>
          )}
          {(activeTab === 'upcoming' ? upcomingEvents : pastEvents).map((event, idx) => (
            <EventCard
              key={event._id}
              event={event}
              onClick={() => navigate(`/participant/events/${event._id}`)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default OrganizerDetail;
