'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api.up.railway.app';
const LS_KEY = 'gyedi_fav_listings';

interface Listing {
  id: string; title: string; price: string | number; images: string[];
  category: string; country: string; storeType: string; views: number;
  condition?: string; sellerFirstName: string; sellerLastName: string; averageRating?: string | number;
}

const FLAG: Record<string, string> = { GH:'🇬🇭',NG:'🇳🇬',GB:'🇬🇧',DE:'🇩🇪',FR:'🇫🇷',US:'🇺🇸',SN:'🇸🇳',CI:'🇨🇮' };

export default function FavouritesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    setLoggedIn(!!token);

    if (token) {
      fetch(`${API}/api/favourites/listings`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setListings(d.listings ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function unfavourite(id: string) {
    const token = localStorage.getItem('gyedi_token');
    if (token) {
      fetch(`${API}/api/favourites/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    // Also remove from localStorage
    try {
      const local: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      localStorage.setItem(LS_KEY, JSON.stringify(local.filter(x => x !== id)));
    } catch {}
    setListings(prev => prev.filter(l => l.id !== id));
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">❤️</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Your Favourites</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in to save and view your favourite listings across devices.</p>
          <Link href="/login" className="bg-[#1B4332] text-white font-bold px-8 py-3 rounded-xl text-base transition-colors hover:bg-[#0F2B1F]">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <div className="bg-[#1B4332] py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Your Saved Items</p>
          <h1 className="text-3xl font-black text-white">Favourites</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-t-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
            <div className="text-5xl mb-4">🤍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No favourites yet</h2>
            <p className="text-gray-500 text-sm mb-6">Tap the heart on any listing to save it here.</p>
            <Link href="/marketplace" className="bg-[#1B4332] text-white font-bold px-7 py-3 rounded-xl text-base transition-colors hover:bg-[#0F2B1F]">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-bold text-gray-900">{listings.length}</span> saved {listings.length === 1 ? 'item' : 'items'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {listings.map(l => {
                const price = parseFloat(l.price.toString());
                return (
                  <div key={l.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden relative">
                    {/* Remove heart */}
                    <button
                      onClick={() => unfavourite(l.id)}
                      className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-[#F5A623] flex items-center justify-center shadow-sm"
                      title="Remove from favourites"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <Link href={`/listing/${l.id}`}>
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        {l.images[0] ? (
                          <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <p className="text-xs text-gray-400 mb-1">{l.category} · {FLAG[l.country] ?? '🌍'}</p>
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#1B4332]">{l.title}</h3>
                        <p className="text-[#1B4332] font-black text-base mt-1.5">
                          GHS {price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{l.sellerFirstName} {l.sellerLastName}</p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
