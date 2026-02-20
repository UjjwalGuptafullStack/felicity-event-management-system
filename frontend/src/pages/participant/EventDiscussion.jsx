import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Loader2, Pin, Megaphone, MessageSquare, User, AlertCircle
} from 'lucide-react';
import { getMessages, postMessage } from '../../api/discussion';
import { getEventById } from '../../api/events';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now  = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const linkify = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline text-accent hover:text-accent/80 break-all">{part}</a>
      : part
  );
};

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  const isAnnouncement = msg.isAnnouncement;
  const isOrganizer    = msg.senderType === 'organizer';

  if (isAnnouncement) {
    return (
      <div className="flex gap-3 px-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Announcement</span>
            <span className="text-xs text-amber-400/70">· {msg.senderName}</span>
            <span className="text-xs text-muted-foreground ml-auto">{fmt(msg.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground-secondary whitespace-pre-wrap leading-relaxed">
            {linkify(msg.content)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
        isOrganizer
          ? 'bg-primary/20 border-primary/40 text-primary'
          : 'bg-muted border-border text-muted-foreground'
      }`}>
        {isOrganizer ? msg.senderName?.[0]?.toUpperCase() : <User className="w-3.5 h-3.5" />}
      </div>

      <div className={`max-w-[75%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Name + time */}
        <div className={`flex items-center gap-2 text-xs text-muted-foreground px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          {isOrganizer
            ? <span className="font-semibold text-primary">{msg.senderName}</span>
            : <span className="font-medium">{'Anonymous'}</span>
          }
          {msg.isPinned && <Pin className="w-3 h-3 text-accent" />}
          <span>{fmt(msg.createdAt)}</span>
        </div>

        {/* Bubble */}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : isOrganizer
            ? 'bg-primary/10 border border-primary/20 text-foreground-secondary rounded-bl-sm'
            : 'bg-muted border border-border text-foreground-secondary rounded-bl-sm'
        }`}>
          {linkify(msg.content)}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EventDiscussion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event,    setEvent]    = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [posting,  setPosting]  = useState(false);
  const [text,     setText]     = useState('');
  const [error,    setError]    = useState('');
  const [postErr,  setPostErr]  = useState('');

  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);

  // Current user id for "isOwn" detection
  const me = (() => {
    try { return JSON.parse(localStorage.getItem('actor') || '{}'); } catch { return {}; }
  })();
  const myId = me?.user?._id || me?.user?.id || me?.id;

  // ── Fetch event + messages ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, msgRes] = await Promise.all([
          getEventById(id),
          getMessages(id, { limit: 100 })
        ]);
        setEvent(evRes.data.event);
        // Sort: pinned first, then chronological
        const msgs = msgRes.data.messages || [];
        msgs.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setMessages(msgs);
      } catch (e) {
        setError(e.response?.data?.message || 'Could not load discussion');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Post message ────────────────────────────────────────────────────────────
  const handlePost = async () => {
    const content = text.trim();
    if (!content || posting) return;
    setPosting(true);
    setPostErr('');
    try {
      const res = await postMessage(id, { content });
      const newMsg = res.data.data;
      setMessages(prev => [...prev, { ...newMsg, id: newMsg.id || newMsg._id }]);
      setText('');
      textareaRef.current.style.height = 'auto';
    } catch (e) {
      setPostErr(e.response?.data?.message || 'Failed to post message. You may need to be registered for this event.');
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  const pinned = messages.filter(m => m.isPinned);
  const regular = messages.filter(m => !m.isPinned);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-lg">
        <button
          onClick={() => navigate(`/participant/events/${id}`)}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-foreground text-base leading-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            Discussion
          </h1>
          {event?.name && (
            <p className="text-xs text-muted-foreground truncate">{event.name}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Start the conversation below.</p>
          </div>
        ) : (
          <>
            {/* Pinned / announcements first */}
            {pinned.length > 0 && (
              <div className="space-y-3">
                {pinned.map((msg, i) => (
                  <MessageBubble
                    key={msg.id || msg._id || i}
                    msg={msg}
                    isOwn={(msg.senderId?.toString?.() || msg.senderId) === myId}
                  />
                ))}
                <div className="border-t border-dashed border-border" />
              </div>
            )}

            {/* Regular messages */}
            <div className="space-y-3">
              {regular.map((msg, i) => (
                <MessageBubble
                  key={msg.id || msg._id || i}
                  msg={msg}
                  isOwn={(msg.senderId?.toString?.() || msg.senderId) === myId}
                />
              ))}
            </div>
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Notice ── */}
      <div className="px-4 py-1.5 bg-muted/20 border-t border-border/50 text-center">
        <p className="text-[11px] text-muted-foreground">
          Your name is not shown to other participants — you appear as <strong>Anonymous</strong>. Organizers can see all posts.
        </p>
      </div>

      {/* ── Post error ── */}
      {postErr && (
        <div className="px-4 py-2 border-t border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {postErr}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="border-t border-border bg-card px-4 py-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or share something… (Enter to send)"
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-xl border border-input-border bg-input-background px-4 py-2.5 text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm leading-relaxed max-h-32 overflow-y-auto"
          style={{ minHeight: '42px' }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={handlePost}
          disabled={!text.trim() || posting}
          className="p-2.5 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-40 text-white transition-colors flex-shrink-0"
          title="Send (Enter)"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
