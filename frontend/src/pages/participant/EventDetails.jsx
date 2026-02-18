import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Clock, Tag, ArrowLeft, Loader2, AlertCircle,
  BadgeCheck, Copy, Check, Share2, UserPlus, Plus, LogIn, X, UsersRound
} from 'lucide-react';
import { getEventById } from '../../api/events';
import {
  registerForEvent,
  createTeam,
  joinTeamByCode
} from '../../api/participant';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const InfoChip = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground-secondary">
    <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
    {label}
  </span>
);

const Alert = ({ type = 'info', children }) => {
  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error:   'bg-red-500/10 border-red-500/20 text-red-400',
    info:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };
  const Icon = type === 'success' ? BadgeCheck : AlertCircle;
  return (
    <div className={`flex items-start gap-2.5 p-4 rounded-xl border text-sm ${colors[type]}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// ─── Create Team Modal ────────────────────────────────────────────────────────
function CreateTeamModal({ event, onClose, onCreate }) {
  const [name, setName]       = useState('');
  const [size, setSize]       = useState(event.teamRegistration?.minSize || 2);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const min = event.teamRegistration?.minSize || 2;
  const max = event.teamRegistration?.maxSize || 5;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Team name is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await createTeam(event.id || event._id, { name: name.trim(), maxSize: size });
      onCreate(res.data.team);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-background-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-accent" /> Create Team
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground-secondary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <Alert type="error">{error}</Alert>}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Team Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ByteForce" maxLength={60}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder-foreground-dim focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Team Size <span className="text-foreground-dim font-normal">({min}–{max} incl. you)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => (
                <button key={n} type="button" onClick={() => setSize(n)}
                  className={`w-12 h-10 rounded-lg text-sm font-semibold border transition-colors ${size === n ? 'bg-primary border-accent text-white' : 'bg-muted border-border text-muted-foreground hover:border-accent/50'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Team
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Join Team Modal ──────────────────────────────────────────────────────────
function JoinTeamModal({ onClose, onJoined }) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Invite code is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await joinTeamByCode(code.trim().toUpperCase());
      onJoined(res.data.team, res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired invite code');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-background-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <LogIn className="w-5 h-5 text-accent" /> Join via Code
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground-secondary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <Alert type="error">{error}</Alert>}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">6-character Invite Code</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="A1B2C3" maxLength={6}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder-foreground-dim focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm tracking-widest font-mono text-center uppercase" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Join Team
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Team status card ─────────────────────────────────────────────────────────
function TeamFormedCard({ team, navigate }) {
  const isFull = team.status === 'complete';
  return (
    <div className="p-5 bg-background-secondary border border-border rounded-2xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <UsersRound className="w-4 h-4 text-accent" /> {team.name}
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${isFull ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
          {isFull ? 'Complete ✓' : `Forming · ${team.slotsLeft} slot${team.slotsLeft !== 1 ? 's' : ''} left`}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{team.currentSize} / {team.maxSize} members</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${isFull ? 'bg-emerald-500' : 'bg-yellow-500'}`}
            style={{ width: `${(team.currentSize / team.maxSize) * 100}%` }} />
        </div>
      </div>
      {!isFull && (
        <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Invite Code</p>
            <p className="text-base font-mono font-bold text-emerald-400 tracking-widest">{team.inviteCode}</p>
          </div>
          <CopyButton text={team.inviteCode} />
        </div>
      )}
      {isFull && <Alert type="success">Team is full! Tickets issued to all {team.maxSize} members.</Alert>}
      <button onClick={() => navigate('/participant/teams')}
        className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
        Manage team →
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event,      setEvent]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [alert,      setAlert]      = useState(null);
  const [modal,      setModal]      = useState(null);   // 'create' | 'join' | null
  const [myTeam,     setMyTeam]     = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEventById(id);
        setEvent(res.data.event);
      } catch {
        setAlert({ type: 'error', text: 'Event not found.' });
      } finally { setLoading(false); }
    })();
  }, [id]);

  const handleSoloRegister = async () => {
    setRegLoading(true); setAlert(null);
    try {
      const res = await registerForEvent(id);
      const ticketId = res.data?.ticket?.ticketId;
      const previewUrl = res.data?.emailPreviewUrl;
      let text = `Registered! Ticket ID: ${ticketId || '—'}`;
      if (previewUrl) {
        text += ` · (Dev) View confirmation email: ${previewUrl}`;
      } else {
        text += '. A confirmation email has been sent.';
      }
      setAlert({ type: 'success', text });
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Registration failed.' });
    } finally { setRegLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;
  if (!event)  return <div className="max-w-2xl mx-auto mt-12 p-6"><Alert type="error">Event not found.</Alert></div>;

  const isTeamEvent = event.teamRegistration?.enabled;
  const isOpen      = event.computed?.isRegistrationOpen ?? (event.registrationDeadline ? new Date(event.registrationDeadline) > new Date() : true);
  const isFull      = event.computed?.isFull;

  return (
    <>
      {modal === 'create' && <CreateTeamModal event={event} onClose={() => setModal(null)} onCreate={t => { setModal(null); setMyTeam(t); setAlert({ type: 'success', text: `Team "${t.name}" created! Share code ${t.inviteCode}.` }); }} />}
      {modal === 'join'   && <JoinTeamModal onClose={() => setModal(null)} onJoined={(t, msg) => { setModal(null); setMyTeam(t); setAlert({ type: 'success', text: msg }); }} />}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => navigate('/participant/browse-events')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>

        {alert && <Alert type={alert.type}>{alert.text}</Alert>}

        {/* Header card */}
        <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
              {event.organizer?.name && <p className="text-sm text-muted-foreground mt-0.5">by {event.organizer.name}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {isTeamEvent && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold flex items-center gap-1">
                  <UsersRound className="w-3 h-3" /> Team Event
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {event.startDate            && <InfoChip icon={Calendar}   label={fmt(event.startDate)} />}
            {event.endDate              && <InfoChip icon={Clock}     label={`Ends ${fmt(event.endDate)}`} />}
            {event.registrationDeadline && <InfoChip icon={Clock}     label={`Reg. closes ${fmt(event.registrationDeadline)}`} />}
            {event.registrationLimit    && <InfoChip icon={Users}     label={`Limit: ${event.registrationLimit}`} />}
            {event.eligibility          && <InfoChip icon={Tag}       label={event.eligibility} />}
            {event.registrationFee > 0  && <InfoChip icon={Tag}       label={`₹${event.registrationFee}`} />}
            {event.registrationFee === 0 && <InfoChip icon={BadgeCheck} label="Free entry" />}
          </div>

          {event.description && (
            <p className="text-sm text-foreground-secondary leading-relaxed whitespace-pre-wrap">{event.description}</p>
          )}
        </div>

        {/* Team info banner */}
        {isTeamEvent && (
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-sm text-blue-300 flex items-start gap-2.5">
            <Share2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Team size: <strong>{event.teamRegistration.minSize}–{event.teamRegistration.maxSize} members</strong>.
              Create your team and share the invite code, or enter a code to join a teammate's team.
            </span>
          </div>
        )}

        {/* Registration actions */}
        {isOpen && !isFull && !myTeam && (
          <div className="p-6 bg-background-secondary border border-border rounded-2xl space-y-4">
            <h2 className="font-bold text-foreground text-lg">Register</h2>
            {isTeamEvent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => setModal('create')}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors">
                  <Plus className="w-4 h-4" /> Create Team
                </button>
                <button onClick={() => setModal('join')}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm transition-colors">
                  <LogIn className="w-4 h-4" /> Join via Code
                </button>
              </div>
            ) : (
              <button onClick={handleSoloRegister} disabled={regLoading}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Register Now
              </button>
            )}
          </div>
        )}

        {myTeam && <TeamFormedCard team={myTeam} navigate={navigate} />}
        {!isOpen && !myTeam && <Alert type="error">Registration is closed for this event.</Alert>}
        {isFull && !myTeam  && <Alert type="error">This event has reached its registration limit.</Alert>}

        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map(t => (
              <span key={t} className="text-xs px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
