import { useState, useEffect } from 'react';
import { getOrganizerProfile, updateOrganizerProfile, submitPasswordReset, getOwnResetRequests, completePasswordChange } from '../../api/organizer';
import { GradientButton } from '../../components/design-system/GradientButton';
import { User, Mail, Phone, Tag, FileText, Save, X, Webhook, Lock, Eye, EyeOff, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';
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

  // Password reset workflow state
  const [resetRequests, setResetRequests] = useState([]);
  const [resetLoading, setResetLoading] = useState(true);
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [newPwForm, setNewPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPw, setShowNewPw] = useState({ new: false, confirm: false });
  const [settingPassword, setSettingPassword] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchResetRequests();
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

  const fetchResetRequests = async () => {
    setResetLoading(true);
    try {
      const res = await getOwnResetRequests();
      setResetRequests(res.data.requests || []);
    } catch {
      // swallow
    } finally {
      setResetLoading(false);
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

  const handleSubmitRequest = async () => {
    if (!requestReason.trim()) {
      showNotice('error', 'Please provide a reason for your password change request.');
      return;
    }
    setSubmittingRequest(true);
    try {
      await submitPasswordReset({ reason: requestReason });
      showNotice('success', 'Password change request submitted! Awaiting admin approval.');
      setRequestReason('');
      setShowRequestForm(false);
      await fetchResetRequests();
    } catch (err) {
      showNotice('error', err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSetNewPassword = async (requestId) => {
    const { newPassword, confirmPassword } = newPwForm;
    if (!newPassword || !confirmPassword) {
      showNotice('error', 'Both password fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      showNotice('error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotice('error', 'Passwords do not match.');
      return;
    }
    setSettingPassword(true);
    try {
      await completePasswordChange(requestId, newPassword);
      showNotice('success', 'Password updated successfully!');
      setNewPwForm({ newPassword: '', confirmPassword: '' });
      await fetchResetRequests();
    } catch (err) {
      showNotice('error', err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSettingPassword(false);
    }
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
                  className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
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
                  className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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

      {/* Password Change Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
      >
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">Password</h4>
              <p className="text-sm text-muted-foreground">Request admin approval to change your password</p>
            </div>
          </div>

          {resetLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading request status…
            </div>
          ) : (() => {
            // Find the most relevant active request
            const active = resetRequests.find(r => ['pending', 'approved'].includes(r.status));
            const lastRejected = !active && resetRequests.find(r => r.status === 'rejected');
            const lastCompleted = !active && !lastRejected && resetRequests.find(r => r.status === 'completed');

            if (active?.status === 'pending') {
              return (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm">
                    <Clock className="w-4 h-4" />
                    Password Change Request Pending
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your request is awaiting admin review. You'll be notified by email when a decision is made.
                  </p>
                  {active.reason && (
                    <p className="text-xs text-muted-foreground italic">Reason: "{active.reason}"</p>
                  )}
                </div>
              );
            }

            if (active?.status === 'approved' && active?.canSetNewPassword) {
              return (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Your request was approved — set your new password below.
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw.new ? 'text' : 'password'}
                        value={newPwForm.newPassword}
                        onChange={e => setNewPwForm(f => ({ ...f, newPassword: e.target.value }))}
                        placeholder="At least 8 characters"
                        className="w-full px-4 py-3 pr-12 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button type="button"
                        onClick={() => setShowNewPw(s => ({ ...s, new: !s.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNewPw.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw.confirm ? 'text' : 'password'}
                        value={newPwForm.confirmPassword}
                        onChange={e => setNewPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="Repeat new password"
                        className="w-full px-4 py-3 pr-12 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button type="button"
                        onClick={() => setShowNewPw(s => ({ ...s, confirm: !s.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNewPw.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <GradientButton onClick={() => handleSetNewPassword(active.id)} disabled={settingPassword}>
                    <Lock className="w-4 h-4 mr-2" />
                    {settingPassword ? 'Saving…' : 'Set New Password'}
                  </GradientButton>
                </div>
              );
            }

            if (lastRejected) {
              return (
                <div className="space-y-4">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                      <XCircle className="w-4 h-4" />
                      Previous request was rejected
                    </div>
                    {lastRejected.adminComment && (
                      <p className="text-sm text-muted-foreground italic">"{lastRejected.adminComment}"</p>
                    )}
                    <p className="text-xs text-muted-foreground">You can submit a new request below.</p>
                  </div>
                  <PasswordRequestForm
                    value={requestReason} onChange={setRequestReason}
                    onSubmit={handleSubmitRequest} submitting={submittingRequest}
                    show={showRequestForm} setShow={setShowRequestForm}
                  />
                </div>
              );
            }

            // No active request (or completed) — show request form option
            return (
              <div className="space-y-4">
                {lastCompleted && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Last password change completed successfully.
                  </div>
                )}
                <PasswordRequestForm
                  value={requestReason} onChange={setRequestReason}
                  onSubmit={handleSubmitRequest} submitting={submittingRequest}
                  show={showRequestForm} setShow={setShowRequestForm}
                />
              </div>
            );
          })()}
        </div>
      </motion.div>
    </div>
  );
}

function PasswordRequestForm({ value, onChange, onSubmit, submitting, show, setShow }) {
  if (!show) {
    return (
      <GradientButton onClick={() => setShow(true)}>
        <Lock className="w-4 h-4 mr-2" />
        Request Password Change
      </GradientButton>
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Reason for password change
        </label>
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          placeholder="Briefly explain why you need to change your password…"
          className="w-full px-4 py-3 bg-input-background border border-input-border rounded-xl text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
      </div>
      <div className="flex gap-3">
        <GradientButton onClick={onSubmit} disabled={submitting}>
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Submitting…' : 'Submit Request'}
        </GradientButton>
        <button onClick={() => { setShow(false); onChange(''); }} disabled={submitting}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:bg-muted/20 transition-colors text-foreground text-sm">
          <X className="w-4 h-4" />Cancel
        </button>
      </div>
    </div>
  );
}
export default OrganizerProfile;