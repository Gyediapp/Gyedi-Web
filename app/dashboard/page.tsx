'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Wallet = { balance: string; inEscrow: string; pending: string };
type Escrow = {
  id: string; code: string; title: string; amount: string; status: string;
  createdAt: string;
  buyer:  { id: string; firstName: string; lastName: string };
  seller: { id: string; firstName: string; lastName: string };
};
type User = { id: string; firstName: string; lastName: string; phone: string };

const STATUS_STYLE: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-800',
  FUNDED:     'bg-green-100 text-green-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  DISPUTED:   'bg-blue-100 text-blue-700',
  CANCELLED:  'bg-gray-100 text-gray-500',
};

const STATUS_BORDER: Record<string, string> = {
  PENDING:    'border-l-amber-400',
  FUNDED:     'border-l-green-500',
  IN_TRANSIT: 'border-l-blue-500',
  COMPLETED:  'border-l-green-500',
  DISPUTED:   'border-l-blue-400',
  CANCELLED:  'border-l-gray-300',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:    'Pending',
  FUNDED:     'Funded',
  IN_TRANSIT: 'In Transit',
  COMPLETED:  'Completed',
  DISPUTED:   'Disputed',
  CANCELLED:  'Cancelled',
};

function fmt(amount: string) {
  return `GHS ${parseFloat(amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [user, setUser]     = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    const stored = localStorage.getItem('gyedi_user');
    if (!token) { window.location.href = '/login'; return; }
    if (stored) setUser(JSON.parse(stored));

    async function load() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [wRes, eRes] = await Promise.all([
          fetch(`${API}/wallet`,  { headers, signal: controller.signal }),
          fetch(`${API}/escrows`, { headers, signal: controller.signal }),
        ]);
        clearTimeout(timer);
        if (wRes.status === 401 || eRes.status === 401) {
          localStorage.removeItem('gyedi_token');
          window.location.href = '/login';
          return;
        }
        const [wData, eData] = await Promise.all([wRes.json(), eRes.json()]);
        setWallet(wData);
        setEscrows(eData.escrows ?? []);
      } catch (err: any) {
        const isTimeout = err?.name === 'AbortError';
        setError(isTimeout ? 'Request timed out — tap to retry.' : 'Could not connect. Check your internet.');
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    }
    load();
  }, []);

  const recent = escrows.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-green-300 text-xs font-medium">Welcome back</p>
            <h1 className="text-white font-bold text-xl">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading…'}
            </h1>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>

        {/* Gold balance card */}
        {loading ? (
          <div className="bg-[#F5A623]/40 rounded-2xl p-5 h-32 animate-pulse" />
        ) : wallet ? (
          <div className="bg-[#F5A623] rounded-2xl p-5 shadow-lg">
            <p className="text-[#1B4332]/70 text-xs font-semibold mb-1">Available Balance</p>
            <p className="text-[#1B4332] font-black text-3xl mb-4">{fmt(wallet.balance)}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1B4332]/10 rounded-xl p-3">
                <p className="text-[#1B4332]/60 text-xs mb-0.5">In Escrow</p>
                <p className="text-[#1B4332] font-bold text-sm">{fmt(wallet.inEscrow)}</p>
              </div>
              <div className="bg-[#1B4332]/10 rounded-xl p-3">
                <p className="text-[#1B4332]/60 text-xs mb-0.5">Pending</p>
                <p className="text-[#1B4332] font-bold text-sm">{fmt(wallet.pending)}</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setLoading(true); setError(''); window.location.reload(); }}
            className="w-full bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-2xl p-5 text-left"
          >
            <p className="text-white/70 text-sm">{error || 'Could not load balance'}</p>
            <p className="text-[#F5A623] text-xs font-semibold mt-1">Tap to retry →</p>
          </button>
        )}
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/escrow/create"
              className="bg-[#F5A623] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-[#1B4332]/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-[#1B4332] font-bold text-xs text-center leading-tight">Create Escrow</span>
            </Link>

            <Link
              href="/history"
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-[#F4F6F8] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-gray-700 font-bold text-xs text-center leading-tight">History</span>
            </Link>

            <Link
              href="/wallet"
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-[#F4F6F8] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-gray-700 font-bold text-xs text-center leading-tight">Wallet</span>
            </Link>
          </div>
        </div>

        {/* Marketplace banner */}
        <Link
          href="/marketplace"
          className="bg-[#1B4332] rounded-2xl p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform border-l-4 border-[#F5A623]"
        >
          <div>
            <p className="text-white font-bold text-base leading-tight">Browse Marketplace</p>
            <p className="text-white/60 text-xs mt-1">Discover listings from verified sellers</p>
          </div>
          <div className="w-11 h-11 bg-[#F5A623]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </Link>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Transactions</h2>
            <Link href="/history" className="text-xs text-[#1B4332] font-semibold">See all</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <p className="text-gray-400 text-sm">No transactions yet</p>
              <Link href="/escrow/create" className="mt-3 inline-block text-[#1B4332] font-semibold text-sm">
                Create your first escrow →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent.map(e => {
                const stored = typeof window !== 'undefined' ? localStorage.getItem('gyedi_user') : null;
                const me = stored ? JSON.parse(stored) as any : null;
                const isBuyer = me?.id === e.buyer.id;
                const other = isBuyer
                  ? `${e.seller.firstName} ${e.seller.lastName}`
                  : `${e.buyer.firstName} ${e.buyer.lastName}`;
                return (
                  <Link
                    key={e.id}
                    href={`/escrow/${e.id}`}
                    className={`bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform border-l-4 ${STATUS_BORDER[e.status] ?? 'border-l-gray-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isBuyer ? 'bg-blue-100 text-blue-700' : 'bg-[#F5A623]/20 text-[#92400E]'
                    }`}>
                      {isBuyer ? 'B' : 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400 truncate">{other} · <span className="text-[#F5A623] font-bold">{e.code}</span></p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmt(e.amount)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[e.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[e.status] ?? e.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {error && !loading && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
