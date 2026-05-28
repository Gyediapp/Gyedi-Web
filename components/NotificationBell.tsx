'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Notif = { id: string; title: string; body: string; type: string; createdAt: string; isRead: boolean };

export default function NotificationBell() {
  const [count, setCount]     = useState(0);
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;

    fetch(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count !== undefined) setCount(d.count); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (fetched) return;

    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications/all?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setNotifs(d.notifications ?? []);
      setCount(0);
      setFetched(true);
    } catch {}
    setLoading(false);
  }

  const typeIcon: Record<string, string> = {
    escrow:    '🔒',
    dispute:   '⚖️',
    kyc:       '🪪',
    referral:  '🎁',
    broadcast: '📢',
    info:      'ℹ️',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notifications</p>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-[#1B4332] font-semibold hover:underline">
              See all
            </Link>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No notifications yet</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {notifs.map(n => (
                <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{typeIcon[n.type] ?? 'ℹ️'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-xs text-[#1B4332] font-semibold border-t border-gray-50 hover:bg-gray-50 transition-colors"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
