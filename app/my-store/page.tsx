'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Listing = {
  id: string; title: string; price: string | number;
  images: string[]; status: string; views: number; category: string;
};

type Escrow = {
  id: string; shortCode: string; agreedAmount: string | number;
  status: string; createdAt: string; sellerPhone: string;
  buyerId: string; sellerId: string;
};

type User = {
  id: string; firstName: string; lastName: string;
  storeName: string | null; storeType: string;
  averageRating: number | null; totalRatings: number;
  kycStatus: string; trustScore: number | null;
};

function fmt(n: string | number) {
  return `GHS ${parseFloat(String(n)).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function MyStorePage() {
  const [user,         setUser]         = useState<User | null>(null);
  const [listings,     setListings]     = useState<Listing[]>([]);
  const [escrows,      setEscrows]      = useState<Escrow[]>([]);
  const [wallet,       setWallet]       = useState<{ balance: string; inEscrow: string } | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [userId,       setUserId]       = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    // Decode user ID from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      setUserId(payload.sub ?? '');
    } catch {}

    Promise.all([
      fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/listings/my-listings`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/transactions`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ transactions: [] })),
      fetch(`${API}/wallet`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([userData, listingsData, txData, walletData]) => {
      if (userData.user) setUser(userData.user);
      if (listingsData.listings) setListings(listingsData.listings);
      if (txData.transactions) setEscrows(txData.transactions);
      if (walletData) setWallet(walletData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeListings  = listings.filter(l => l.status === 'ACTIVE').length;
  const soldListings    = listings.filter(l => l.status === 'SOLD').length;
  const totalViews      = listings.reduce((acc, l) => acc + (l.views ?? 0), 0);
  const pendingEscrows  = escrows.filter(e => ['FUNDED', 'SELLER_CONFIRMED', 'IN_TRANSIT'].includes(e.status)).length;
  const completedEscrows = escrows.filter(e => e.status === 'COMPLETED').length;
  const topListings     = [...listings].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 3);
  const recentEscrows   = escrows.slice(0, 3);
  const storeName       = user?.storeName || `${user?.firstName} ${user?.lastName}`;

  // Profile completion
  const checks = [
    !!user?.storeName,
    user?.kycStatus === 'VERIFIED',
    listings.length > 0,
    !!wallet,
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const ESCROW_STATUS: Record<string, { label: string; color: string }> = {
    DRAFT:            { label: 'Draft',      color: 'bg-gray-100 text-gray-500'   },
    FUNDED:           { label: 'Funded',     color: 'bg-blue-100 text-blue-700'   },
    SELLER_CONFIRMED: { label: 'Confirmed',  color: 'bg-purple-100 text-purple-700' },
    IN_TRANSIT:       { label: 'Shipped',    color: 'bg-amber-100 text-amber-700' },
    DELIVERED:        { label: 'Delivered',  color: 'bg-teal-100 text-teal-700'   },
    COMPLETED:        { label: 'Completed',  color: 'bg-green-100 text-green-700' },
    DISPUTED:         { label: 'Disputed',   color: 'bg-red-100 text-red-700'     },
    CANCELLED:        { label: 'Cancelled',  color: 'bg-gray-100 text-gray-400'   },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-8">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">Store Dashboard</p>
            <h1 className="text-white font-black text-2xl mt-0.5">{storeName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                user?.storeType === 'PRO'      ? 'bg-[#F5A623]/20 text-[#F5A623]' :
                user?.storeType === 'BUSINESS' ? 'bg-white/20 text-white' :
                'bg-white/10 text-white/60'
              }`}>
                {user?.storeType === 'PRO' ? '⭐ Pro' : user?.storeType === 'BUSINESS' ? '✪ Business' : 'Basic'}
              </span>
              {user?.kycStatus === 'VERIFIED' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-300">✔ Verified</span>
              )}
              {user?.averageRating && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F5A623]/20 text-[#F5A623]">
                  ⭐ {parseFloat(String(user.averageRating)).toFixed(1)} ({user.totalRatings})
                </span>
              )}
            </div>
          </div>
          <Link href={`/store/${userId}`} target="_blank"
            className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
            View Store
          </Link>
        </div>

        {/* Wallet summary */}
        {wallet && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#F5A623] rounded-2xl p-4">
              <p className="text-[#1B4332]/70 text-xs font-semibold mb-1">Available Balance</p>
              <p className="text-[#1B4332] font-black text-xl">{fmt(wallet.balance)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-white/60 text-xs font-semibold mb-1">In Escrow</p>
              <p className="text-white font-black text-xl">{fmt(wallet.inEscrow)}</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Add Listing',    href: '/sell',            icon: '➕' },
           { label: 'New Escrow',     href: '/escrow/create',   icon: '🔒' },
          { label: 'Watermark',      href: '/watermark',       icon: '🖼️' },
          { label: 'Settings', href: '/my-store/settings', icon: '⚙️' },
            
          
          
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="bg-white/10 hover:bg-white/20 rounded-xl py-3 flex flex-col items-center gap-1 transition-colors">
              <span className="text-lg">{a.icon}</span>
              <span className="text-white/80 text-[10px] font-semibold text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Profile completion */}
        {completion < 100 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-900">Store Setup</p>
              <span className="text-sm font-black text-[#1B4332]">{completion}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mb-3">
              <div className="h-2 bg-[#1B4332] rounded-full transition-all" style={{ width: `${completion}%` }} />
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Set store name', done: !!user?.storeName, href: '/profile' },
                { label: 'Complete KYC verification', done: user?.kycStatus === 'VERIFIED', href: '/verify' },
                { label: 'Add your first listing', done: listings.length > 0, href: '/sell' },
                { label: 'Add MoMo account', done: !!wallet, href: '/wallet' },
              ].map(item => (
                <Link key={item.label} href={item.href}
                  className="flex items-center gap-3 py-1 hover:text-[#1B4332] transition-colors">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.done ? '✔' : '○'}
                  </span>
                  <span className={`flex-1 text-sm font-semibold ${item.done ? 'line-through text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
              <svg className={`w-5 h-5 flex-shrink-0 ${item.done ? 'text-green-400' : 'text-[#1B4332]'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Active"   value={activeListings}  sub="listings live"        color="bg-green-100 text-green-700"  icon="🟢" />
          <StatCard label="Views"    value={totalViews}       sub="total across listings" color="bg-blue-100 text-blue-700"    icon="👁️" />
          <StatCard label="Sold"     value={soldListings}     sub="listings sold"         color="bg-amber-100 text-amber-700"  icon="✅" />
          <StatCard label="Escrows"  value={completedEscrows} sub="completed safely"      color="bg-purple-100 text-purple-700" icon="🔒" />
        </div>

        {/* Pending escrows */}
        {pendingEscrows > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <p className="text-sm font-black text-amber-800">{pendingEscrows} Active Escrow{pendingEscrows > 1 ? 's' : ''}</p>
              <p className="text-xs text-amber-600">Require your attention</p>
            </div>
            <Link href="/history" className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl">
              View →
            </Link>
          </div>
        )}

        {/* Top listings */}
        {topListings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top Listings by Views</p>
              <Link href="/my-listings" className="text-xs text-[#1B4332] font-bold">See all →</Link>
            </div>
            {topListings.map((l, i) => (
              <Link key={l.id} href={`/listing/${l.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <span className="text-lg font-black text-gray-300 w-5 text-center">{i + 1}</span>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {l.images?.[0] ? (
                    <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.title}</p>
                  <p className="text-xs text-gray-400">{fmt(l.price)} · {l.views} views</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  l.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{l.status}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Recent escrows */}
        {recentEscrows.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recent Escrows</p>
              <Link href="/history" className="text-xs text-[#1B4332] font-bold">See all →</Link>
            </div>
            {recentEscrows.map(e => {
              const s = ESCROW_STATUS[e.status] ?? { label: e.status, color: 'bg-gray-100 text-gray-500' };
              const isBuyer = e.buyerId === userId;
              return (
                <Link key={e.id} href={`/escrow/${e.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#1B4332]/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{isBuyer ? '🛒' : '📦'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">#{e.shortCode}</p>
                    <p className="text-xs text-gray-400">{isBuyer ? 'Buying' : 'Selling'} · {fmt(e.agreedAmount)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Store Tools</p>
          </div>
          {[
            { label: 'Manage Listings',      href: '/my-listings',  icon: '📋', desc: 'Edit, delete, mark sold' },
            { label: 'Transaction History',  href: '/history',      icon: '📊', desc: 'All escrows and transfers' },
            { label: 'Wallet & MoMo',     href: '/wallet',       icon: '💰', desc: 'Balance and MoMo accounts' },
            { label: 'Image Watermark Tool', href: '/watermark',    icon: '🖼️', desc: 'Protect your photos' },
            { label: 'Store Profile',        href: '/profile',      icon: '⚙️', desc: 'Edit store name, bio, theme' },
            { label: 'Community Forum',      href: '/community',    icon: '💬', desc: 'Connect with other sellers' },
            { label: 'Upgrade Plan',         href: '/pricing',      icon: '⭐', desc: 'Pro & Business features' },
          ].map(({ label, href, icon, desc }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
