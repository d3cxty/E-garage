"use client";
import { useEffect, useRef, useState } from 'react';
import { socket } from '@/lib/socket';
import api from '@/lib/api';
import { format } from 'timeago.js';
import clsx from 'clsx';

type Msg = {
  _id?: string;
  room: string;
  sender: string;
  text: string;
  at?: string;
  createdAt?: string;
  pending?: boolean;
  error?: string;
};

export default function Chat({ room }: { room: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [connected, setConnected] = useState<boolean>(socket.connected);
  const [typing, setTyping] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const atBottomRef = useRef(true);
  const clearTypingTimer = useRef<any>(null);
  const lastTypingEmit = useRef<number>(0);

  // Track messages we've already inserted (prevents dupes)
  const seenRef = useRef<Set<string>>(new Set());
  const sig = (m: Msg) => m._id || `${m.sender}|${m.text}|${m.at || m.createdAt || ''}`;

  const me =
    typeof window !== 'undefined' && localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user')!)
      : null;
  const myName = me?.email || 'guest';

  const scrollToBottom = () => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  };
  const isNearBottom = () => {
    const el = boxRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
  };

  useEffect(() => {
    let mounted = true;
    if (!socket.connected) socket.connect();
    socket.emit('chat:join', { room });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onTyping = (payload: any) => {
      if (!mounted) return;
      if (payload?.room === room && payload?.sender !== myName) {
        setTyping(payload.sender || 'someone');
        if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
        clearTypingTimer.current = setTimeout(() => setTyping(null), 1500);
      }
    };

    const onMsg = (msg: Msg) => {
      if (msg.room !== room) return;

      setMessages(prev => {
        // 1) Replace optimistic (pending) message from the same sender+text
        const pendIdx = prev.findIndex(
          p => p.pending && p.sender === msg.sender && p.text === msg.text
        );
        if (pendIdx !== -1) {
          const copy = [...prev];
          copy[pendIdx] = msg;
          seenRef.current.add(sig(msg));
          return copy;
        }

        // 2) If we already have this id/signature, ignore
        const key = sig(msg);
        if (seenRef.current.has(key)) return prev;

        // 3) Insert new
        seenRef.current.add(key);
        return [msg, ...prev];
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:typing', onTyping);
    socket.on('chat:message', onMsg);

    // initial fetch
    api
      .get(`/chat/${encodeURIComponent(room)}/messages?limit=50`)
      .then(r => {
        if (!mounted) return;
        const arr: Msg[] = Array.isArray(r.data?.messages) ? r.data.messages : [];
        setMessages(arr);
        // seed seen set to avoid re-adding the same past messages
        const s = new Set<string>();
        for (const m of arr) s.add(sig(m));
        seenRef.current = s;
      })
      .catch(e => {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load messages');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setTimeout(scrollToBottom, 0);
        }
      });

    return () => {
      mounted = false;
      socket.emit('chat:leave', { room });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:typing', onTyping);
      socket.off('chat:message', onMsg);
      if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
    };
  }, [room, myName]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onScroll = () => {
      atBottomRef.current = isNearBottom();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!loading && atBottomRef.current) scrollToBottom();
  }, [messages, loading]);

  function send() {
    const body = text.trim();
    if (!body || !connected) return;

    const tempId = 'tmp-' + Date.now();
    const when = new Date().toISOString();
    const optimistic: Msg = {
      _id: tempId,
      room,
      sender: myName,
      text: body,
      at: when,
      pending: true,
    };

    // show optimistic bubble
    setMessages(prev => [optimistic, ...prev]);
    setText('');
    inputRef.current?.focus();

    // Let the SERVER echo be the source of truth.
    // Only use ack to flip error on the optimistic one if it failed.
    socket.emit('chat:message', { room, sender: myName, text: body }, (ack: any) => {
      if (!ack?.ok) {
        setMessages(prev =>
          prev.map(m => (m._id === tempId ? { ...m, pending: false, error: 'Failed to send' } : m))
        );
      }
      // If ack is ok, do nothing here — onMsg will replace the optimistic bubble.
    });
  }

  function onType(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    const now = Date.now();
    if (connected && now - lastTypingEmit.current > 900) {
      lastTypingEmit.current = now;
      socket.emit('chat:typing', { room, sender: myName });
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <span className={clsx('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-slate-500')} />
          <span>Room: {room}</span>
          {typing && <span className="ml-2 text-xs text-slate-400">{typing} is typing…</span>}
        </div>
        {error && (
          <button
            onClick={() => {
              setLoading(true);
              setError(undefined);
            }}
            className="text-xs text-amber-300 hover:underline"
          >
            Retry load
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {loading && <div className="text-sm text-slate-500">Loading messages…</div>}
        {!loading && error && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">{error}</div>
        )}
        {!loading &&
          !error &&
          messages
            .slice()
            .reverse()
            .map(m => {
              const mine = m.sender === myName;
              const when = m.at || m.createdAt;
              return (
                <div
                  key={m._id || m.sender + m.text + (when || '')}
                  className={clsx('flex', mine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={clsx(
                      'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow',
                      mine ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-slate-800 text-slate-100'
                    )}
                  >
                    <div className="mb-0.5 text-[11px] opacity-80">{m.sender}</div>
                    <div>{m.text}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] opacity-70">
                      {when && <span>{format(when)}</span>}
                      {m.pending && <span>Sending…</span>}
                      {m.error && <span className="text-rose-300">{m.error}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Composer */}
      <div className="flex gap-2 border-t border-slate-800 p-3">
        <input
          ref={inputRef}
          value={text}
          onChange={onType}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={connected ? 'Type a message…' : 'Connecting…'}
          className="flex-1 rounded-xl bg-slate-800 px-3 py-2 outline-none disabled:opacity-60"
          disabled={!connected}
        />
        <button
          onClick={send}
          className={clsx('rounded-xl px-4', connected ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-700/60 cursor-not-allowed')}
          disabled={!connected}
        >
          Send
        </button>
      </div>
    </div>
  );
}
