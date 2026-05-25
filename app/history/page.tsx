'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Party  = { id: string; firstName: string; lastName: string };
type Escrow = {
  id: string; code: string; title: string; amount: string;
  status: string; createdAt: string;
  buyer: Party; seller: Party;
};

type Filter = 'ALL' | 'ACTIVE' | 'FUNDED' | 'IN_TRANSIT' | 'COMPLETED' | 'DISPUTED';

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: 'ALL',        label: 'All' },
  { key: 'ACTIVE',     label: 'Active' },
  { key: 'FUNDED',     label: 'Funded' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'COMPLETED',  label: 'Completed' },
  { key: 'DISPUTED',   label: 'Disputed' },
];

const STATUS_STYLE: Record<string, string> = {
  FUNDED:     'bg-green-100 text-green-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  DISPUTED:   'bg-blue-100 text-blue-700',
  CANCELLED:  'bg-gray-100 text-gray-500',
  PENDING:    'bg-amber-100 text-amber-800',
};

const STATUS_BORDER: Record<string, string> = {
  FUNDED:     'border-l-green-500',
  IN_TRANSIT: 'border-l-blue-500',
  COMPLETED:  'border-l-green-500',
  DISPUTED:   'border-l-blue-400',
  CANCELLED:  'border-l-gray-300',
  PENDING:    'border-l-amber-400',
};

const STATUS_LABEL: Record<string, string> = {
  FUNDED: 'Funded', IN_TRANSIT: 'In Transit', COMPLETED: 'Completed',
  DISPUTED: 'Disputed', CANCELLED: 'Cancelled', PENDING: 'Pending',
};

const ACTIVE_STATUSES = new Set(['FUNDED', 'IN_TRANSIT', 'PENDING']);

function fmt(amount: string) {
  return `GHS ${parseFloat(amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function HistoryPage() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState<Filter>('ALL');
  const [search, setSearch]   = useState('');
  const [myId, setMyId]       = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    const stored = localStorage.getItem('gyedi_user');
    if (stored) setMyId(JSON.parse(stored).id);

    fetch(`${API}/escrows`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('gyedi_token'); window.location.href = '/login'; }
        return r.json();
      })
      .then(d => setEscrows(d.escrows ?? []))
      .catch(() => setError('Could not load transactions'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = escrows;
    if (filter === 'ACTIVE')     list = list.filter(e => ACTIVE_STATUSES.has(e.status));
    if (filter === 'FUNDED')     list = list.filter(e => e.status === 'FUNDED');
    if (filter === 'IN_TRANSIT') list = list.filter(e => e.status === 'IN_TRANSIT');
    if (filter === 'COMPLETED')  list = list.filter(e => e.status === 'COMPLETED');
    if (filter === 'DISPUTED')   list = list.filter(e => e.status === 'DISPUTED');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.buyer.firstName.toLowerCase().includes(q) ||
        e.seller.firstName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [escrows, filter, search]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-5">
        <h1 className="text-white font-bold text-xl mb-4">History</h1>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by title, code, or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/40 pl-9 pr-4 py-2.5 rounded-xl text-sm border border-white/20 focus:outline-none focus:border-[#F5A623]/60"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 pt-4 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filter === key
                ? 'bg-[#F5A623] text-[#1B4332] shadow-sm'
                : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            {label}
            {key !== 'ALL' && !loading && (
              <span className="ml-1.5 opacity-60">
                ({
                  key === 'ACTIVE'     ? escrows.filter(e => ACTIVE_STATUSES.has(e.status)).length :
                  key === 'FUNDED'     ? escrows.filter(e => e.status === 'FUNDED').length :
                  key === 'IN_TRANSIT' ? escrows.filter(e => e.status === 'IN_TRANSIT').length :
                  key === 'COMPLETED'  ? escrows.filter(e => e.status === 'COMPLETED').length :
                  escrows.filter(e => e.status === 'DISPUTED').length
                })
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {error && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 mt-4">
            <p className="text-gray-400 text-sm">
              {search ? 'No results match your search' : 'No transactions yet'}
            </p>
            {!search && (
              <Link href="/escrow/create" className="mt-3 inline-block text-[#1B4332] font-semibold text-sm">
                Create your first escrow →
              </Link>
            )}
          </div>
        ) : (
          filtered.map(e => {
            const isBuyer = myId === e.buyer.id;
            const other   = isBuyer
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
                  <p className="text-xs text-gray-400 truncate">
                    {other} · <span className="text-[#F5A623] font-bold">{e.code}</span> · {fmtDate(e.createdAt)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 mb-1">{fmt(e.amount)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[e.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
