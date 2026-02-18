import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../../api/participant';
import { GradientButton } from '../../components/design-system/GradientButton';
import { User, Mail, Phone, Building2, Lock, Save, X, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    collegeOrOrg: '',
    interests: [],
    followedOrganizers: []
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.data.user);
      setFormData({
        firstName: response.data.user.firstName || '',
        lastName: response.data.user.lastName || '',
        contactNumber: response.data.user.contactNumber || '',
        collegeOrOrg: response.data.user.collegeOrOrg || '',
        interests: response.data.user.preferences?.interests || [],
        followedOrganizers: response.data.user.preferences?.followedOrganizers || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      showNotice('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      await fetchProfile();
      setEditing(false);
      showNotice('success', 'Profile updated successfully!');
    } catch (error) {
      showNotice('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      contactNumber: profile.contactNumber || '',
      collegeOrOrg: profile.collegeOrOrg || '',
      interests: profile.preferences?.interests || [],
      followedOrganizers: profile.preferences?.followedOrganizers || []
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl">
      {/* Notice */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-xl border ${
              notice.type === 'success'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            {notice.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-light p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  <p className="text-white/80 text-sm sm:text-base">{profile?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Non-Editable Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/5 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Email</span>
                  </div>
                 
                  <p className="text-foreground font-medium">{profile?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
                </div>
                <div className="bg-muted/5 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Participant Type</span>
                  </div>
                  <p className="text-foreground font-medium">
                    {profile?.participantType === 'IIIT' ? 'IIIT Student' : 'External Participant'}
                  
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Editable Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Personal Details
                </h3>
                {!editing ? (
                  <GradientButton size="sm" onClick={() => setEditing(true)}>
                    Edit Profile
                  </GradientButton>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/10 text-foreground hover:bg-muted/20 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <GradientButton size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </GradientButton>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    College/Organization
                  </label>
                  <input
                    type="text"
                    value={formData.collegeOrOrg}
                    onChange={(e) => setFormData({ ...formData, collegeOrOrg: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Interests / Preferences Section */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Areas of Interest
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'tech', label: 'Technology & Coding', emoji: '💻' },
                  { value: 'sports', label: 'Sports & Fitness', emoji: '⚽' },
                  { value: 'cultural', label: 'Cultural & Arts', emoji: '🎭' },
                  { value: 'music', label: 'Music', emoji: '🎵' },
                  { value: 'dance', label: 'Dance', emoji: '💃' },
                  { value: 'literature', label: 'Literature & Quiz', emoji: '📚' },
                  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
                  { value: 'science', label: 'Science & Research', emoji: '🔬' },
                  { value: 'entrepreneurship', label: 'Entrepreneurship', emoji: '🚀' },
                  { value: 'design', label: 'Design & Creativity', emoji: '🎨' },
                  { value: 'photography', label: 'Photography & Film', emoji: '📷' },
                  { value: 'social', label: 'Social & Community', emoji: '🤝' },
                ].map(opt => {
                  const selected = formData.interests.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!editing}
                      onClick={() => {
                        if (!editing) return;
                        setFormData(prev => ({
                          ...prev,
                          interests: selected
                            ? prev.interests.filter(i => i !== opt.value)
                            : [...prev.interests, opt.value]
                        }));
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/10 border-border text-muted-foreground'
                      } ${editing ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'}`}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {formData.interests.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {editing ? 'Click to select your areas of interest' : 'No interests selected — click Edit Profile to add some'}
                </p>
              )}
            </div>

            {/* Security Section */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Security Settings
              </h3>
              <div className="bg-muted/5 border border-border rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground mb-1">Password</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Last changed {new Date().toLocaleDateString()}
                    </p>
                    <GradientButton size="sm" variant="accent">
                      Change Password
                    </GradientButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </motion.div>
    </div>
  );
}

export default Profile;
