import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listOrganizers, followOrganizer, unfollowOrganizer } from '../../api/participant';
import { GradientButton } from '../../components/design-system/GradientButton';
import { Users, Heart, Mail, Tag } from 'lucide-react';
import { motion } from 'motion/react';

function Organizers() {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(new Set());

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await listOrganizers();
      setOrganizers(response.data.organizers || []);
      // Assume API returns followed status
      const followedIds = new Set(
        (response.data.organizers || [])
          .filter(o => o.isFollowed)
          .map(o => o._id)
      );
      setFollowing(followedIds);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (organizerId) => {
    try {
      if (following.has(organizerId)) {
        await unfollowOrganizer(organizerId);
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(organizerId);
          return newSet;
        });
      } else {
        await followOrganizer(organizerId);
        setFollowing(prev => new Set(prev).add(organizerId));
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
          <p className="text-muted-foreground">Loading clubs & organizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Clubs & Organizers
        </h1>
        <p className="text-muted-foreground">
          Follow your favorite clubs to stay updated on their events
        </p>
      </motion.div>

      {/* Organizers Grid */}
      {organizers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No organizers available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizers.map((organizer, idx) => (
            <motion.div
              key={organizer._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group cursor-pointer"
              onClick={() => navigate(`/participant/organizers/${organizer.id || organizer._id}`)}
            >
              {/* Header */}
              <div className={`h-32 bg-gradient-to-br ${
                idx % 3 === 0 ? 'from-primary to-primary-light' :
                idx % 3 === 1 ? 'from-secondary to-secondary-light' :
                'from-accent to-accent-light'
              } relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20">
                  <Users className="w-32 h-32 absolute -bottom-8 -right-8 text-white" />
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                      {organizer.name}
                    </h3>
                    {organizer.category && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="w-3.5 h-3.5" />
                        <span className="truncate">{organizer.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                {organizer.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {organizer.description}
                  </p>
                )}

                {organizer.contactEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 truncate">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{organizer.contactEmail}</span>
                  </div>
                )}

                {/* Follow Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFollow(organizer._id);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    following.has(organizer._id)
                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${following.has(organizer._id) ? 'fill-current' : ''}`} />
                  {following.has(organizer._id) ? 'Unfollow' : 'Follow'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Organizers;
