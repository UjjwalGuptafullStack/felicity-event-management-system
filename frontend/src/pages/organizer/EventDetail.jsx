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
  Pencil,
  X,
  Save,
  Star,
  Download,
  MessageSquare,
  Pin,
  PinOff,
  Megaphone,
  Trash2,
} from 'lucide-react';
import { GradientButton } from '../../components/design-system/GradientButton';
import { getOrganizerEvent, getEventRegistrations, publishEvent, updateEvent, getEventFeedback, getEventFeedbackStats, exportFeedbackCSV } from '../../api/organizer';
import { getMessages, pinMessage, unpinMessage, deleteMessage, postAnnouncement } from '../../api/discussion';

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
  return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

// Convert ISO date string → "YYYY-MM-DDTHH:MM" for datetime-local inputs
const toInputDT = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputCls = 'mt-1 w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50';

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent]             = useState(null);
  const [registrations, setRegs]      = useState([]);
  const [loading, setLoading]         = useState(true);
  const [regsLoading, setRegsLoading] = useState(true);
  const [error, setError]             = useState(null);
  const [publishing, setPublishing]   = useState(false);
  const [publishMsg, setPublishMsg]   = useState(null);

  // Feedback state
  const [feedback,      setFeedback]      = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [ratingFilter,  setRatingFilter]  = useState(0);   // 0 = all
  const [exportingCSV,  setExportingCSV]  = useState(false);

  // Discussion state
  const [discussion,       setDiscussion]    = useState([]);
  const [discLoading,      setDiscLoading]   = useState(false);
  const [announceText,     setAnnounceText]  = useState('');
  const [announcing,       setAnnouncing]    = useState(false);
  const [discMsg,          setDiscMsg]       = useState(null);
  const [discActionId,     setDiscActionId]  = useState(null); // id currently being pin/deleted

  // Edit mode
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState(null);
  const [formData, setFormData] = useState(null);

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
      } catch { /* swallow */ } finally {
        setRegsLoading(false);
      }
    };
    const fetchFeedback = async () => {
      setFeedbackLoading(true);
      try {
        const [fbRes, statsRes] = await Promise.all([
          getEventFeedback(id),
          getEventFeedbackStats(id)
        ]);
        setFeedback(fbRes.data.feedback || []);
        setFeedbackStats(statsRes.data.stats || null);
      } catch { /* swallow */ } finally {
        setFeedbackLoading(false);
      }
    };
    const fetchDiscussion = async () => {
      setDiscLoading(true);
      try {
        const res = await getMessages(id, { limit: 100 });
        const msgs = res.data.messages || [];
        msgs.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setDiscussion(msgs);
      } catch { /* swallow */ } finally {
        setDiscLoading(false);
      }
    };
    fetchEvent();
    fetchRegs();
    fetchFeedback();
    fetchDiscussion();
  }, [id]);

  const startEditing = () => {
    setFormData({
      name:                 event.name || '',
      description:          event.description || '',
      type:                 event.type || 'normal',
      eligibility:          event.eligibility || '',
      registrationDeadline: toInputDT(event.registrationDeadline),
      startDate:            toInputDT(event.startDate),
      endDate:              toInputDT(event.endDate),
      registrationLimit:    event.registrationLimit ?? '',
      registrationFee:      event.registrationFee ?? 0,
      tags:                 (event.tags || []).join(', '),
      teamRegistration: {
        enabled: event.teamRegistration?.enabled || false,
        minSize: event.teamRegistration?.minSize || 2,
        maxSize: event.teamRegistration?.maxSize || 5,
      },
    });
    setSaveMsg(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setFormData(null);
    setSaveMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload = {
        ...formData,
        registrationLimit: formData.registrationLimit !== '' ? parseInt(formData.registrationLimit) : undefined,
        registrationFee:   parseFloat(formData.registrationFee) || 0,
        tags:              formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      await updateEvent(id, payload);
      // Refresh event data
      const res = await getOrganizerEvent(id);
      setEvent(res.data.event);
      setEditing(false);
      setFormData(null);
      setSaveMsg({ type: 'success', text: 'Draft saved successfully!' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  const fmtDisc = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const diff = (Date.now() - date) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const handleAnnounce = async () => {
    const content = announceText.trim();
    if (!content || announcing) return;
    setAnnouncing(true); setDiscMsg(null);
    try {
      await postAnnouncement(id, { content });
      setAnnounceText('');
      const res = await getMessages(id, { limit: 100 });
      const msgs = res.data.messages || [];
      msgs.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setDiscussion(msgs);
      setDiscMsg({ type: 'success', text: 'Announcement posted.' });
    } catch (e) {
      setDiscMsg({ type: 'error', text: e.response?.data?.message || 'Failed to post announcement.' });
    } finally { setAnnouncing(false); }
  };

  const handlePin = async (msgId, currentlyPinned) => {
    setDiscActionId(msgId);
    try {
      if (currentlyPinned) await unpinMessage(id, msgId);
      else await pinMessage(id, msgId);
      setDiscussion(prev => {
        const updated = prev.map(m =>
          (m.id || m._id)?.toString() === msgId.toString()
            ? { ...m, isPinned: !currentlyPinned }
            : m
        );
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
      });
    } catch { /* swallow */ } finally { setDiscActionId(null); }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    setDiscActionId(msgId);
    try {
      await deleteMessage(id, msgId);
      setDiscussion(prev => prev.filter(m => (m.id || m._id)?.toString() !== msgId.toString()));
    } catch { /* swallow */ } finally { setDiscActionId(null); }
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await exportFeedbackCSV(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-${event?.name?.replace(/\s+/g, '-') || id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* swallow */ } finally {
      setExportingCSV(false);
    }
  };

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      {error}
    </div>
  );

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

          {['published', 'ongoing', 'completed'].includes(event.status) && (
            <button
              onClick={() => navigate(`/organizer/attendance/${id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-semibold transition-colors border border-blue-500/30"
            >
              <BadgeCheck className="w-4 h-4" />
              Scan Attendance
            </button>
          )}

          {event.status === 'draft' && !editing && (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 text-foreground text-sm font-semibold transition-colors border border-border"
              >
                <Pencil className="w-4 h-4" />
                Edit Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish Event
              </button>
            </>
          )}

          {event.status === 'draft' && editing && (
            <>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 text-foreground text-sm font-semibold transition-colors border border-border"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <GradientButton onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </GradientButton>
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {publishMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          publishMsg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {publishMsg.type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {publishMsg.text}
        </div>
      )}
      {saveMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          saveMsg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {saveMsg.type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {saveMsg.text}
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editing && formData && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            Edit Draft Event
          </h2>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground">Event Name *</label>
            <input type="text" value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className={inputCls} required />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={formData.description} rows={4}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              className={inputCls} />
          </div>

          {/* Type + Eligibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Event Type *</label>
              <select value={formData.type}
                onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                className={inputCls}>
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise Event</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Eligibility</label>
              <select value={formData.eligibility}
                onChange={e => setFormData(f => ({ ...f, eligibility: e.target.value }))}
                className={inputCls}>
                <option value="">Select eligibility…</option>
                <option value="Open to all">Open to all</option>
                <option value="IIIT students only">IIIT students only</option>
                <option value="External participants only">External participants only</option>
                <option value="Invite only">Invite only</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Registration Deadline *</label>
              <input type="datetime-local" value={formData.registrationDeadline}
                onChange={e => setFormData(f => ({ ...f, registrationDeadline: e.target.value }))}
                className={inputCls} required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Start Date *</label>
              <input type="datetime-local" value={formData.startDate}
                onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                className={inputCls} required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">End Date *</label>
              <input type="datetime-local" value={formData.endDate}
                onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                className={inputCls} required />
            </div>
          </div>

          {/* Limit + Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Registration Limit</label>
              <input type="number" value={formData.registrationLimit} min={1}
                placeholder="Leave blank for unlimited"
                onChange={e => setFormData(f => ({ ...f, registrationLimit: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Registration Fee (₹)</label>
              <input type="number" value={formData.registrationFee} min={0} step="0.01"
                placeholder="0 for free event"
                onChange={e => setFormData(f => ({ ...f, registrationFee: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground">Tags</label>
            <input type="text" value={formData.tags}
              placeholder="Comma-separated, e.g. hackathon, coding, ml"
              onChange={e => setFormData(f => ({ ...f, tags: e.target.value }))}
              className={inputCls} />
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
                  <input type="number" min={2} max={10} value={formData.teamRegistration.minSize}
                    onChange={e => setFormData(f => ({ ...f, teamRegistration: { ...f.teamRegistration, minSize: parseInt(e.target.value) || 2 } }))}
                    className="mt-1 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Max Team Size</label>
                  <input type="number" min={2} max={20} value={formData.teamRegistration.maxSize}
                    onChange={e => setFormData(f => ({ ...f, teamRegistration: { ...f.teamRegistration, maxSize: parseInt(e.target.value) || 5 } }))}
                    className="mt-1 w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-input-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Save / Cancel row */}
          <div className="flex gap-3 pt-2">
            <GradientButton onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </GradientButton>
            <button onClick={cancelEditing} disabled={saving}
              className="px-6 py-3 rounded-xl border border-border hover:bg-muted/20 transition-colors text-foreground flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── READ-ONLY VIEW (always shown, edit mode form is above) ── */}
      {!editing && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{event.name}</h1>
            {event.type && (
              <p className="text-sm text-muted-foreground mt-1 capitalize">{event.type} event</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-background-secondary border border-border rounded-2xl">
            <InfoRow icon={Calendar} label="Start Date"              value={fmt(event.startDate)} />
            <InfoRow icon={Calendar} label="End Date"                value={fmt(event.endDate)} />
            <InfoRow icon={Clock}    label="Registration Deadline"   value={fmt(event.registrationDeadline)} />
            <InfoRow icon={Users}    label="Registration Limit"      value={event.registrationLimit ? `${event.registrationLimit} seats` : 'Unlimited'} />
            <InfoRow icon={Tag}      label="Eligibility"             value={event.eligibility} />
            <InfoRow icon={FileText} label="Registration Fee"        value={event.registrationFee ? `₹${event.registrationFee}` : 'Free'} />
          </div>

          {event.description && (
            <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</h2>
              <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.teamRegistration?.enabled && (
            <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-3">
              <UsersRound className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-blue-300">Team Registration Enabled</p>
                <p className="text-xs text-blue-400/70">
                  Teams of {event.teamRegistration.minSize}–{event.teamRegistration.maxSize} members.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Registrations — always visible */}
      <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Registrations</h2>
          {!regsLoading && <span className="text-xs text-muted-foreground">{registrations.length} total</span>}
        </div>

        {regsLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /></div>
        ) : registrations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No registrations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left py-2 pr-4 font-medium"><span className="flex items-center gap-1"><User className="w-3 h-3" /> Name</span></th>
                  <th className="text-left py-2 pr-4 font-medium"><span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span></th>
                  <th className="text-left py-2 pr-4 font-medium"><span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</span></th>
                  <th className="text-left py-2 pr-4 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.registrationId} className="border-b border-muted hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 text-foreground-secondary font-medium">{reg.participant?.name || '—'}</td>
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
      {/* ── Discussion Forum ── */}
      <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Discussion Forum
            <span className="text-xs normal-case bg-muted px-2 py-0.5 rounded-full font-normal">
              {discussion.length} message{discussion.length !== 1 ? 's' : ''}
            </span>
          </h2>
        </div>

        {/* Post announcement */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-amber-400" /> Post Announcement (pinned automatically)
          </label>
          <div className="flex gap-2">
            <textarea
              value={announceText}
              onChange={e => setAnnounceText(e.target.value)}
              placeholder="Write an announcement for all registrants…"
              rows={2}
              maxLength={2000}
              className="flex-1 resize-none rounded-xl border border-input-border bg-input-background px-4 py-2.5 text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm"
            />
            <button
              onClick={handleAnnounce}
              disabled={!announceText.trim() || announcing}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex-shrink-0 flex items-center gap-1.5 self-end"
            >
              {announcing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
          {discMsg && (
            <p className={`text-xs ${discMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {discMsg.text}
            </p>
          )}
        </div>

        {/* Message list */}
        {discLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /></div>
        ) : discussion.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No messages yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {discussion.map((msg) => {
              const msgId = msg.id || msg._id;
              const busy  = discActionId?.toString() === msgId?.toString();
              return (
                <div key={msgId} className={`p-3 rounded-xl border space-y-1 ${
                  msg.isAnnouncement
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : msg.isPinned
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/10 border-border/50'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {msg.isAnnouncement && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Announcement
                      </span>
                    )}
                    {msg.isPinned && !msg.isAnnouncement && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    <span className={`text-xs font-semibold ${msg.senderType === 'organizer' ? 'text-primary' : 'text-muted-foreground'}`}>
                      {msg.senderType === 'organizer' ? msg.senderName : 'Anonymous Participant'}
                    </span>
                    <span className="text-xs text-foreground-dim ml-auto">{fmtDisc(msg.createdAt)}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePin(msgId, msg.isPinned)}
                        disabled={busy}
                        title={msg.isPinned ? 'Unpin' : 'Pin'}
                        className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-accent transition-colors disabled:opacity-40"
                      >
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : msg.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleDelete(msgId)}
                        disabled={busy}
                        title="Delete"
                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-secondary whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Feedback Analytics ── */}
      <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Feedback
            {feedbackStats && (
              <span className="ml-1 text-xs normal-case bg-muted px-2 py-0.5 rounded-full font-normal">
                {feedbackStats.totalFeedback} response{feedbackStats.totalFeedback !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          {feedback.length > 0 && (
            <button
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors text-muted-foreground disabled:opacity-50"
            >
              {exportingCSV ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Export CSV
            </button>
          )}
        </div>

        {feedbackLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /></div>
        ) : !feedbackStats || feedbackStats.totalFeedback === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No feedback submitted yet.</p>
        ) : (
          <>
            {/* Stats summary */}
            <div className="flex flex-wrap gap-4 items-start">
              {/* Average */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 min-w-[100px]">
                <span className="text-4xl font-bold text-foreground">{Number(feedbackStats.averageRating).toFixed(1)}</span>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(feedbackStats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground mt-1">avg rating</span>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 space-y-1.5 min-w-[180px]">
                {[5,4,3,2,1].map(s => {
                  const count = feedbackStats.ratingDistribution?.[s] || 0;
                  const pct   = feedbackStats.totalFeedback > 0 ? (count / feedbackStats.totalFeedback) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <span className="w-2 text-muted-foreground">{s}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-7 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter + comment list */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Filter by rating:</span>
                {[0,5,4,3,2,1].map(r => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      ratingFilter === r
                        ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400'
                        : 'border-border text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    {r === 0 ? 'All' : `${r} ★`}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {feedback
                  .filter(fb => ratingFilter === 0 || fb.rating === ratingFilter)
                  .map((fb, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-1">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(fb.submittedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </span>
                      </div>
                      {fb.comment && <p className="text-sm text-foreground-secondary leading-relaxed">{fb.comment}</p>}
                    </div>
                  ))
                }
                {feedback.filter(fb => ratingFilter === 0 || fb.rating === ratingFilter).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No comments for this rating.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

