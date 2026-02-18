import { useState, useEffect } from 'react';
import { getOrganizerProfile, updateOrganizerProfile } from '../../api/organizer';
import { GradientButton } from '../../components/design-system/GradientButton';
import { User, Mail, Phone, Tag, FileText, Save, X, Webhook } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function OrganizerProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhook: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getOrganizerProfile();
      setProfile(response.data.organizer);
      setFormData({
        name: response.data.organizer.name || '',
        category: response.data.organizer.category || '',
        description: response.data.organizer.description || '',
        contactEmail: response.data.organizer.contactEmail || '',
        contactNumber: response.data.organizer.contactNumber || '',
        discordWebhook: response.data.organizer.discordWebhook || ''
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
      await updateOrganizerProfile(formData);
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
      name: profile.name || '',
      category: profile.category || '',
      description: profile.description || '',
      contactEmail: profile.contactEmail || '',
      contactNumber: profile.contactNumber || '',
      discordWebhook: profile.discordWebhook || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            className={`rounded-xl border px-4 py-3 mb-6 ${
              notice.type === 'error'
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-success/10 text-success border-success/20'
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
        className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 border-b border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{profile?.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{profile?.category || 'Organizer'}</p>
              </div>
            </div>
            {!editing && (
              <GradientButton onClick={() => setEditing(true)}>
                Edit Profile
              </GradientButton>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Login Email (Non-editable) */}
          <div className="bg-muted/20 border border-border rounded-xl p-4">
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Login Email (Non-editable)
            </label>
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 text-primary" />
              <span>{profile?.loginEmail}</span>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <User className="w-4 h-4 inline mr-2 text-primary" />
                Organization Name *
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              ) : (
                <p className="text-muted-foreground px-4 py-3">{profile?.name || 'Not set'}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Tag className="w-4 h-4 inline mr-2 text-primary" />
                Category
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Cultural, Technical, Sports"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <p className="text-muted-foreground px-4 py-3">{profile?.category || 'Not set'}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <FileText className="w-4 h-4 inline mr-2 text-primary" />
                Description
              </label>
              {editing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell people about your organization..."
                  rows="4"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              ) : (
                <p className="text-muted-foreground px-4 py-3 whitespace-pre-wrap">{profile?.description || 'Not set'}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Mail className="w-4 h-4 inline mr-2 text-primary" />
                Contact Email *
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              ) : (
                <p className="text-muted-foreground px-4 py-3">{profile?.contactEmail}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Phone className="w-4 h-4 inline mr-2 text-primary" />
                Contact Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <p className="text-muted-foreground px-4 py-3">{profile?.contactNumber || 'Not set'}</p>
              )}
            </div>

            {/* Discord Webhook */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Webhook className="w-4 h-4 inline mr-2 text-primary" />
                Discord Webhook URL
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Auto-post new events to your Discord server
              </p>
              {editing ? (
                <input
                  type="url"
                  value={formData.discordWebhook}
                  onChange={(e) => setFormData({ ...formData, discordWebhook: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <p className="text-muted-foreground px-4 py-3 break-all">{profile?.discordWebhook || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex gap-3 pt-4">
              <GradientButton
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </GradientButton>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-muted/20 transition-colors text-foreground"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default OrganizerProfile;
