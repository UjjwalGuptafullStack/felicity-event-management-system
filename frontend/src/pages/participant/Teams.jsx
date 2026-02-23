import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersRound, Loader2, AlertCircle, BadgeCheck, Copy, Check,
  LogIn, X, Trash2, LogOut, RefreshCw, Plus, Calendar, MessageSquare
} from 'lucide-react';
import { getMyTeams, getTeamDetail, cancelTeam, leaveTeam, joinTeamByCode } from '../../api/participant';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    forming:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    complete:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const label = {
    forming: 'Forming',
    complete: 'Complete ✓',
    cancelled: 'Cancelled',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${map[status] || map.forming}`}>
      {label[status] || status}
    </span>
  );
};

// ─── Join-by-code modal ───────────────────────────────────────────────────────
function JoinModal({ onClose, onJoined }) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Enter a code'); return; }
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
      <div className="bg-background-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2 text-base">
            <LogIn className="w-4 h-4 text-accent" /> Join via Code
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground-secondary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="6-char code  e.g. A1B2C3"
            maxLength={6}
            className="w-full rounded-lg border border-input-border bg-input-background px-4 py-3 text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm tracking-widest font-mono text-center uppercase"
          />
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Join Team
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Team card ────────────────────────────────────────────────────────────────
function TeamCard({ team: summary, onRefresh, currentUserId }) {
  const [team, setTeam]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [actionLoading, setAL]    = useState(false);
  const [msg, setMsg]             = useState(null);
  const navigate                  = useNavigate();

  const loadDetail = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getTeamDetail(summary.id);
      setTeam(res.data.team);
    } catch {
      setTeam(summary); // fallback to summary
    } finally { setLoading(false); }
  }, [summary.id]);

  const toggleExpand = () => {
    if (!expanded && !team) loadDetail();
    setExpanded(v => !v);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel and dissolve the team?')) return;
    setAL(true);
    try {
      await cancelTeam(summary.id);
      setMsg({ type: 'success', text: 'Team cancelled.' });
      await onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setAL(false); }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this team?')) return;
    setAL(true);
    try {
      await leaveTeam(summary.id);
      setMsg({ type: 'success', text: 'You left the team.' });
      await onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setAL(false); }
  };

  const t = team || summary;
  const isLeader  = t.isLeader;
  const isForming = t.status === 'forming';

  return (
    <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
      {/* Card header */}
      <button
        onClick={toggleExpand}
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-muted/40 transition-colors"
      >
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-foreground truncate">{t.name}</span>
            <StatusBadge status={t.status} />
            {isLeader && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Leader</span>
            )}
          </div>
          {t.event?.name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {t.event.name}
              {t.event.startDate && ` · ${fmt(t.event.startDate)}`}
            </p>
          )}
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.currentSize} / {t.maxSize} members</span>
              {isForming && <span>{t.slotsLeft} slot{t.slotsLeft !== 1 ? 's' : ''} remaining</span>}
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${t.status === 'complete' ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.round((t.currentSize / t.maxSize) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <span className="text-muted-foreground text-xs mt-1 flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border p-5 space-y-4">
          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {msg.type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}

          {/* Invite code */}
          {isForming && (
            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Invite Code</p>
                <p className="text-lg font-mono font-bold text-accent tracking-widest">{t.inviteCode}</p>
              </div>
              <CopyButton text={t.inviteCode} />
            </div>
          )}

          {/* Members list */}
          {loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /></div>}
          {t.members?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Members</p>
              {t.members.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-card rounded-lg">
                  <div>
                    <p className="text-sm text-foreground-secondary font-medium">
                      {m.name || 'Unknown'}
                      {m.isLeader && <span className="ml-2 text-xs text-info">(Leader)</span>}
                    </p>
                    {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                  </div>
                  {m.joinedAt && (
                    <p className="text-xs text-foreground-dim">Joined {fmt(m.joinedAt)}</p>
                  )}
                </div>
              ))}
              {/* Empty slots */}
              {isForming && Array.from({ length: t.slotsLeft }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center p-2.5 bg-background border border-dashed border-border rounded-lg">
                  <p className="text-xs text-foreground-dim italic">Awaiting member…</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Chat button — available for all active team members */}
            {t.status !== 'cancelled' && (
              <button
                onClick={() => navigate(`/participant/teams/${summary.id}/chat`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open Chat
              </button>
            )}
            {isForming && isLeader && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Cancel Team
              </button>
            )}
            {isForming && !isLeader && (
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Leave Team
              </button>
            )}
            {t.event?.id && (
              <button
                onClick={() => navigate(`/participant/events/${t.event.id}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-accent text-xs font-semibold transition-colors"
              >
                View Event →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const { data: authData } = (() => {
    try { return { data: JSON.parse(localStorage.getItem('actor') || '{}') }; } catch { return { data: {} }; }
  })();
  const currentUserId = authData?.user?._id || authData?.user?.id;

  const [teams,   setTeams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [toast,   setToast]   = useState(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await getMyTeams();
      setTeams(res.data.teams || []);
    } catch { /* silently ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleJoined = (team, msg) => {
    setModal(false);
    showToast('success', msg);
    fetchTeams();
  };

  const forming   = teams.filter(t => t.status === 'forming');
  const complete  = teams.filter(t => t.status === 'complete');
  const others    = teams.filter(t => t.status !== 'forming' && t.status !== 'complete');

  return (
    <>
      {modal && <JoinModal onClose={() => setModal(false)} onJoined={handleJoined} />}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UsersRound className="w-6 h-6 text-accent" />
              My Teams
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track and manage your hackathon teams</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoading(true); fetchTeams(); }}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4" /> Join via Code
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-2 p-4 rounded-xl border text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {toast.type === 'success' ? <BadgeCheck className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <UsersRound className="w-12 h-12 text-border mx-auto" />
            <p className="text-muted-foreground font-medium">No teams yet</p>
            <p className="text-sm text-foreground-dim">
              Create a team from an event page, or join one with an invite code.
            </p>
            <button
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4" /> Join via Code
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {forming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Forming ({forming.length})</h2>
                {forming.map(t => <TeamCard key={t.id} team={t} onRefresh={fetchTeams} currentUserId={currentUserId} />)}
              </section>
            )}
            {complete.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Complete ({complete.length})</h2>
                {complete.map(t => <TeamCard key={t.id} team={t} onRefresh={fetchTeams} currentUserId={currentUserId} />)}
              </section>
            )}
            {others.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Other ({others.length})</h2>
                {others.map(t => <TeamCard key={t.id} team={t} onRefresh={fetchTeams} currentUserId={currentUserId} />)}
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
