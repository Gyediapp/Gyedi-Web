'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Notif = { id: string; title: string; body: string; type: string; createdAt: string; isRead: boolean };

const TYPE_ICON: Record<string, string> = {
  escrow:    '🔒',
  dispute:   '⚖️',
  kyc:       '🪪',
  referral:  '🎁',
  broadcast: '📢',
  info:      'ℹ️',
};

const TYPE_COLOR: Record<string, string> = {
  escrow:    'bg-green-100 text-green-700',
  dispute:   'bg-blue-100 text-blue-700',
  kyc:       'bg-amber-100 text-amber-700',
  referral:  'bg-purple-100 text-purple-700',
  broadcast: 'bg-[#F5A623]/15 text-[#92400E]',
  info:      'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [offset, setOffset]   = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  async function load(o = 0) {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (o === 0) setLoading(true);
    try {
      const res = await fetch(`${API}/notifications/all?limit=${LIMIT}&offset=${o}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      const batch: Notif[] = d.notifications ?? [];
      setNotifs(prev => o === 0 ? batch : [...prev, ...batch]);
      setHasMore(batch.length === LIMIT);
      setOffset(o + batch.length);
    } catch (e: any) {
      setError(e.message ?? 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(0); }, []);

  function fmt(iso: string) {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000)  return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      <div className="bg-[#1B4332] px-5 pt-12 pb-6 flex items-center gap-3">
        <Link href="/dashboard" className="text-white/60 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-white font-bold text-xl">Notifications</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {loading && notifs.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-500 text-sm">No notifications yet</p>
            <p className="text-gray-400 text-xs mt-1">You&apos;ll see escrow updates, KYC status, and more here</p>
          </div>
        )}

        {notifs.map(n => (
          <div
            key={n.id}
            className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-3 ${!n.isRead ? 'border-l-4 border-l-[#1B4332]' : ''}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base ${TYPE_COLOR[n.type] ?? TYPE_COLOR.info}`}>
              {TYPE_ICON[n.type] ?? '🔔'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-semibold leading-tight ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                <p className="text-[10px] text-gray-400 flex-shrink-0">{fmt(n.createdAt)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.body}</p>
            </div>
          </div>
        ))}

        {hasMore && !loading && (
          <button
            onClick={() => load(offset)}
            className="w-full bg-white border border-gray-100 text-[#1B4332] font-semibold text-sm py-3 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Load more
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
