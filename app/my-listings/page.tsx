'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Listing = {
  id: string; title: string; description: string;
  price: string | number; category: string; images: string[];
  status: string; views: number; createdAt: string;
};

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Active'  },
  SOLD:   { bg: 'bg-gray-100',  text: 'text-gray-500',   dot: 'bg-gray-400',   label: 'Sold'    },
  DRAFT:  { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400',  label: 'Draft'   },
  PAUSED: { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400',   label: 'Paused'  },
};

function fmt(n: string | number) {
  return `GHS ${parseFloat(String(n)).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

export default function MyListingsPage() {
  const [listings,  setListings]  = useState<Listing[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState<'ALL' | 'ACTIVE' | 'SOLD' | 'DRAFT'>('ALL');
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [marking,   setMarking]   = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/listings/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem('gyedi_token'); window.location.href = '/login'; return; }
      const data = await res.json() as { listings: Listing[] };
      setListings(data.listings ?? []);
    } catch {
      setError('Could not load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteListing(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API}/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setListings(prev => prev.filter(l => l.id !== id));
      else setError('Could not delete listing.');
    } catch {
      setError('Could not delete listing.');
    } finally {
      setDeleting(null);
    }
  }

  async function markAsSold(id: string) {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setMarking(id);
    try {
      const res = await fetch(`${API}/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'SOLD' }),
      });
      if (res.ok) setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'SOLD' } : l));
      else setError('Could not update listing.');
    } catch {
      setError('Could not update listing.');
    } finally {
      setMarking(null);
    }
  }

  async function reactivate(id: string) {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setMarking(id);
    try {
      const res = await fetch(`${API}/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (res.ok) setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'ACTIVE' } : l));
      else setError('Could not update listing.');
    } catch {
      setError('Could not update listing.');
    } finally {
      setMarking(null);
    }
  }

  const FILTERS = ['ALL', 'ACTIVE', 'SOLD', 'DRAFT'] as const;
  const shown = filter === 'ALL' ? listings : listings.filter(l => l.status === filter);
  const activeCount = listings.filter(l => l.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">Seller Hub</p>
            <h1 className="text-white font-black text-xl mt-0.5">My Listings</h1>
          </div>
          <Link
            href="/sell"
            className="flex items-center gap-1.5 bg-[#F5A623] text-[#1B4332] font-black text-sm px-4 py-2.5 rounded-xl hover:bg-[#e09520] transition-colors shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Listing
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total',  value: listings.length,   color: 'text-white'       },
            { label: 'Active', value: activeCount,        color: 'text-[#F5A623]'  },
            { label: 'Sold',   value: listings.filter(l => l.status === 'SOLD').length, color: 'text-green-300' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
              <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
              <p className="text-white/60 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'ALL' ? `All (${listings.length})` : `${STATUS_STYLE[f]?.label ?? f} (${listings.filter(l => l.status === f).length})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Listing cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="text-5xl mb-3">🏪</div>
            <p className="text-gray-700 font-bold text-base">
              {filter === 'ALL' ? 'No listings yet' : `No ${filter.toLowerCase()} listings`}
            </p>
            <p className="text-gray-400 text-sm mt-1 mb-5">
              {filter === 'ALL' ? 'Start selling to reach thousands of buyers.' : `Switch filter to see other listings.`}
            </p>
            {filter === 'ALL' && (
              <Link href="/sell" className="inline-flex items-center gap-2 bg-[#F5A623] text-[#1B4332] font-black px-6 py-3 rounded-xl hover:bg-[#e09520] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(listing => {
              const s = STATUS_STYLE[listing.status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: listing.status };
              const thumb = listing.images?.[0];
              const isBusy = deleting === listing.id || marking === listing.id;
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {thumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={thumb} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🏪</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
                        <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </div>
                      <p className="text-[#1B4332] font-black text-sm mt-0.5">{fmt(listing.price)}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{listing.category} · {listing.views ?? 0} views</p>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex border-t border-gray-50 divide-x divide-gray-50">
                    <Link
                      href={`/listing/${listing.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-[#1B4332] hover:bg-green-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </Link>

                    {listing.status === 'ACTIVE' ? (
                      <button
                        onClick={() => markAsSold(listing.id)}
                        disabled={isBusy}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {marking === listing.id ? '…' : 'Mark Sold'}
                      </button>
                    ) : listing.status === 'SOLD' ? (
                      <button
                        onClick={() => reactivate(listing.id)}
                        disabled={isBusy}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                      >
                        {marking === listing.id ? '…' : 'Relist'}
                      </button>
                    ) : (
                      <Link
                        href={`/listing/${listing.id}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Publish
                      </Link>
                    )}

                    <Link
                      href={`/listing/${listing.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>

                    <button
                      onClick={() => deleteListing(listing.id)}
                      disabled={isBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deleting === listing.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
