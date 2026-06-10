'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const POLL_MS = 5000;

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

type Escrow = {
  id: string;
  code: string;
  title: string;
  buyerId: string;
  buyer:  { firstName: string; lastName: string };
  seller: { firstName: string; lastName: string };
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type ListItem =
  | { kind: 'divider'; key: string; label: string }
  | { kind: 'message'; key: string; msg: Message };

function buildItems(messages: Message[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== lastDate) {
      lastDate = day;
      items.push({ kind: 'divider', key: `d-${msg.createdAt}`, label: formatDateLabel(msg.createdAt) });
    }
    items.push({ kind: 'message', key: msg.id, msg });
  }
  return items;
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const escrowId = params.id;

  const [myId,      setMyId]      = useState('');
  const [escrow,    setEscrow]    = useState<Escrow | null>(null);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  };

  const fetchMessages = useCallback(async (token: string, silent = false) => {
    try {
      const res = await fetch(`${API}/escrows/${escrowId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(prev => {
        const newMsgs: Message[] = data.messages ?? [];
        if (JSON.stringify(prev.map(m => m.id)) === JSON.stringify(newMsgs.map((m: Message) => m.id))) return prev;
        return newMsgs;
      });
      if (!silent) scrollToBottom();
    } catch {
      // ignore poll errors
    } finally {
      if (!silent) setLoading(false);
    }
  }, [escrowId]);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    const stored = localStorage.getItem('gyedi_user');
    if (!token) { window.location.href = '/login'; return; }
    if (stored) setMyId(JSON.parse(stored).id);

    // fetch escrow details
    fetch(`${API}/escrows/${escrowId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.escrow) setEscrow(d.escrow); })
      .catch(() => {});

    // initial load
    fetchMessages(token).then(() => {
      setLoading(false);
      setTimeout(() => scrollToBottom(), 80);
    });

    // poll every 5 seconds
    pollRef.current = setInterval(() => fetchMessages(token, true), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [escrowId, fetchMessages]);

  // scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) setTimeout(() => scrollToBottom(true), 50);
  }, [messages.length]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending) return;
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setSendError('');
    setSending(true);
    setInputText('');
    try {
      const res = await fetch(`${API}/escrows/${escrowId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error ?? 'Failed to send.'); setInputText(text); return; }
      setMessages(prev => [...prev, data.message]);
      setTimeout(() => scrollToBottom(true), 50);
    } catch {
      setSendError('Could not send. Check your connection.');
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const counterparty = escrow
    ? (myId === escrow.buyerId
        ? `${escrow.seller.firstName} ${escrow.seller.lastName}`
        : `${escrow.buyer.firstName} ${escrow.buyer.lastName}`)
    : '';

  const items = buildItems(messages);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col pb-16">
      {/* Header */}
      <div className="bg-[#1B4332] px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-20 shadow-lg">
        <Link
          href={`/escrow/${escrowId}`}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a1 1 0 00-1 1v14a1 1 0 001 1h3v3l4-3h11a1 1 0 001-1V4a1 1 0 00-1-1z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base truncate">
            {counterparty || escrow?.title || 'Chat'}
          </p>
          <p className="text-white/50 text-xs truncate">
            {escrow ? `${escrow.title} · ${escrow.code}` : 'Loading…'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1.5 flex-shrink-0">
          <svg className="w-3 h-3 text-[#F5A623]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          <span className="text-[#F5A623] text-xs font-semibold">Private</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-[#1B4332]/8 rounded-3xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-[#1B4332]/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a1 1 0 00-1 1v14a1 1 0 001 1h3v3l4-3h11a1 1 0 001-1V4a1 1 0 00-1-1z" />
              </svg>
            </div>
            <p className="text-gray-800 font-bold text-lg">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Start the conversation below</p>
          </div>
        ) : (
          items.map(item => {
            if (item.kind === 'divider') {
              return (
                <div key={item.key} className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-semibold px-2 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              );
            }

            const { msg } = item;
            const mine = msg.senderId === myId;
            const isBuyerMsg = escrow ? msg.senderId === escrow.buyerId : false;

            return (
              <div key={msg.id} className={`flex items-end gap-2 mb-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <div className="w-8 h-8 rounded-full bg-[#1B4332] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
                    <span className="text-white text-xs font-bold">{msg.senderName[0]}</span>
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  mine
                    ? 'bg-[#1B4332] rounded-br-sm'
                    : 'bg-[#F5A623] rounded-b1-sm'
                }`}>
                  {!mine && (
                    <p className="text-[#1B4332] text-xs font-bold mb-1">{msg.senderName}</p>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isBuyerMsg ? 'text-white' : 'text-[#1B4332]'}`}>
                    {msg.text}
                  </p>
                  <p className={`text-[10px] mt-1 text-right ${isBuyerMsg ? 'text-white/50' : 'text-[#1B4332]/60'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
                {mine && (
                  <div className="w-8 h-8 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0 mb-0.5">
                    <span className="text-[#1B4332] text-xs font-bold">Me</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="mx-4 mb-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-2.5">
          {sendError}
        </div>
      )}

      {/* Input bar — sits above bottom nav */}
      <div className="sticky bottom-16 bg-white border-t border-gray-200 px-3 py-3 flex items-end gap-2 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          maxLength={1000}
          className="flex-1 bg-[#F4F6F8] border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1B4332]/40 resize-none max-h-32 leading-relaxed"
          style={{ minHeight: '44px' }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          className="w-11 h-11 rounded-full bg-[#1B4332] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#1B4332]/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-95"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

    </div>
  );
}
