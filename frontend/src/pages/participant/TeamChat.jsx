import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Paperclip, Loader2, Users, Circle, FileText, Download, X
} from 'lucide-react';
import { getSocket } from '../../sockets/socket';
import { getChatMessages, uploadChatFile } from '../../api/chat';
import { getTeamDetail } from '../../api/participant';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
  const date = new Date(d);
  const now  = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const linkify = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-accent hover:text-accent/80 break-all">{part}</a>
      : part
  );
};

const isImageFile = (name = '') => /\.(jpe?g|png|gif|webp|svg)$/i.test(name);

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5 group`}>
      {!isOwn && (
        <span className="text-xs text-muted-foreground px-1 font-medium">{msg.senderName}</span>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
        isOwn
          ? 'bg-primary text-white rounded-br-sm'
          : 'bg-muted border border-border text-foreground-secondary rounded-bl-sm'
      }`}>
        {msg.type === 'file' ? (
          isImageFile(msg.fileName) ? (
            <a href={`${BACKEND_URL}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer">
              <img
                src={`${BACKEND_URL}${msg.fileUrl}`}
                alt={msg.fileName}
                className="max-w-full max-h-48 rounded-lg object-contain"
              />
            </a>
          ) : (
            <a
              href={`${BACKEND_URL}${msg.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="underline break-all text-xs">{msg.fileName}</span>
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          )
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{linkify(msg.content)}</p>
        )}
      </div>
      <span className="text-[10px] text-foreground-dim px-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {fmt(msg.createdAt)}
      </span>
    </div>
  );
}

// ─── Main chat component ──────────────────────────────────────────────────────
export default function TeamChat() {
  const { teamId } = useParams();
  const navigate   = useNavigate();

  // Team info
  const [team, setTeam]           = useState(null);
  const [teamLoading, setTL]      = useState(true);

  // Socket & connection
  const [connected, setConnected] = useState(false);
  const [socketError, setSockErr] = useState(null);
  const socketRef                 = useRef(null);

  // Messages
  const [messages, setMessages]   = useState([]);
  const [msgLoading, setMsgLoad]  = useState(true);
  const [hasMore, setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Online presence
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnline, setShowOnline]   = useState(false);

  // Typing
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimerRef                = useRef(null);
  const isTypingRef                   = useRef(false);

  // Input
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef              = useRef(null);

  // Scroll
  const bottomRef    = useRef(null);
  const listRef      = useRef(null);
  const prevScrollH  = useRef(0);

  // Current user info from localStorage
  const me = (() => {
    try { return JSON.parse(localStorage.getItem('actor') || '{}'); } catch { return {}; }
  })();
  const myId = me?.user?._id || me?.user?.id || me?.id;

  // ── Load team detail ───────────────────────────────────────────────────────
  useEffect(() => {
    getTeamDetail(teamId)
      .then(r => setTeam(r.data.team))
      .catch(() => {})
      .finally(() => setTL(false));
  }, [teamId]);

  // ── Load initial messages ──────────────────────────────────────────────────
  useEffect(() => {
    getChatMessages(teamId)
      .then(r => {
        setMessages(r.data.messages || []);
        setHasMore(r.data.hasMore || false);
      })
      .catch(() => {})
      .finally(() => setMsgLoad(false));
  }, [teamId]);

  // ── Setup socket ───────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      setSockErr(null);
      socket.emit('join-team', { teamId });
    };

    const onConnectError = (err) => {
      setSockErr(err.message || 'Connection failed');
      setConnected(false);
    };

    const onDisconnect = () => setConnected(false);

    const onJoined = () => {
      // joined-team confirm; online presence arrives via presence-update
    };

    const onNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    const onOnlineUpdate = ({ online }) => {
      setOnlineUsers(online || []);
    };

    const onTyping = ({ userId, name }) => {
      if (userId === myId) return;
      setTypingUsers(prev =>
        prev.find(u => u.id === userId) ? prev : [...prev, { id: userId, name }]
      );
    };

    const onStopTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.id !== userId));
    };

    const onError = ({ message }) => setSockErr(message);

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect',          onConnect);
    socket.on('connect_error',    onConnectError);
    socket.on('disconnect',       onDisconnect);
    socket.on('joined-team',      onJoined);
    socket.on('new-message',      onNewMessage);
    socket.on('presence-update',  onOnlineUpdate);
    socket.on('user-typing',      onTyping);
    socket.on('user-stop-typing', onStopTyping);
    socket.on('chat-error',       onError);

    return () => {
      socket.emit('leave-team', { teamId });
      socket.off('connect',          onConnect);
      socket.off('connect_error',    onConnectError);
      socket.off('disconnect',       onDisconnect);
      socket.off('joined-team',      onJoined);
      socket.off('new-message',      onNewMessage);
      socket.off('presence-update',  onOnlineUpdate);
      socket.off('user-typing',      onTyping);
      socket.off('user-stop-typing', onStopTyping);
      socket.off('chat-error',       onError);
    };
  }, [teamId, myId]);

  // ── Auto-scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    if (!msgLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, msgLoading]);

  // ── Load older messages ────────────────────────────────────────────────────
  const loadMore = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    const oldest = messages[0]?._id || messages[0]?.id;
    setLoadingMore(true);
    prevScrollH.current = listRef.current?.scrollHeight || 0;
    try {
      const r = await getChatMessages(teamId, { before: oldest });
      const older = r.data.messages || [];
      setMessages(prev => [...older, ...prev]);
      setHasMore(r.data.hasMore || false);
      // Preserve scroll position
      requestAnimationFrame(() => {
        if (listRef.current) {
          const newH = listRef.current.scrollHeight;
          listRef.current.scrollTop = newH - prevScrollH.current;
        }
      });
    } catch { /* swallow */ } finally {
      setLoadingMore(false);
    }
  };

  // ── Typing emit ────────────────────────────────────────────────────────────
  const emitTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { teamId });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop-typing', { teamId });
    }, 2000);
  }, [teamId]);

  // ── Send text ──────────────────────────────────────────────────────────────
  const handleSend = () => {
    const content = text.trim();
    if (!content || sending) return;
    const socket = socketRef.current;
    if (!socket) return;

    setSending(true);
    socket.emit('send-message', { teamId, content });
    setSending(false);
    setText('');

    // stop typing
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    socket.emit('stop-typing', { teamId });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setFilePreview({ name: file.name, size: file.size });
    setUploading(true);
    try {
      const r = await uploadChatFile(teamId, file);
      const { fileUrl, fileName, fileType } = r.data;
      const socket = socketRef.current;
      if (socket) {
        socket.emit('send-file-message', { teamId, fileUrl, fileName, fileType });
      }
    } catch { /* swallow */ } finally {
      setUploading(false);
      setFilePreview(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const otherTyping = typingUsers.map(u => u.name).join(', ');

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/participant/teams')}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-bold text-foreground text-base leading-tight">
              {teamLoading ? '…' : (team?.name || 'Team Chat')}
            </h1>
            {team?.event?.name && (
              <p className="text-xs text-muted-foreground">{team.event.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection dot */}
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}
               title={connected ? 'Connected' : 'Disconnected'} />
          {/* Online count */}
          <button
            onClick={() => setShowOnline(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors px-2 py-1 rounded-lg hover:bg-muted/40"
          >
            <Users className="w-3.5 h-3.5" />
            {onlineUsers.length} online
          </button>
        </div>
      </div>

      {/* ── Online panel (slide-in) ── */}
      {showOnline && onlineUsers.length > 0 && (
        <div className="border-b border-border bg-muted/20 px-4 py-2 flex flex-wrap gap-2">
          {onlineUsers.map((u, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-foreground-secondary bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
              {u.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Error banner ── */}
      {socketError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs text-center">
          {socketError} — messages may not send in real time
        </div>
      )}

      {/* ── Message list ── */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-accent/40 disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '↑ Load earlier messages'}
            </button>
          </div>
        )}

        {msgLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg._id || msg.id || i}
              msg={msg}
              isOwn={(msg.senderId?.toString() || msg.senderId) === myId}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </span>
            <span>{otherTyping} {typingUsers.length === 1 ? 'is' : 'are'} typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── File upload preview ── */}
      {filePreview && (
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-foreground-secondary flex-1 truncate">{filePreview.name}</span>
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin text-accent" />
            : <button onClick={() => setFilePreview(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
          }
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="border-t border-border bg-card px-4 py-3 flex items-end gap-2">
        {/* File attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors flex-shrink-0 disabled:opacity-40"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.csv"
        />

        {/* Text input */}
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); emitTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Message your team…"
          rows={1}
          maxLength={4000}
          className="flex-1 resize-none rounded-xl border border-input-border bg-input-background px-4 py-2.5 text-input-foreground placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm leading-relaxed max-h-32 overflow-y-auto"
          style={{ minHeight: '42px' }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
          }}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || !connected}
          className="p-2.5 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-40 text-white transition-colors flex-shrink-0"
          title="Send (Enter)"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
