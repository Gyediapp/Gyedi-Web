'use client';

import { useState, useEffect } from 'react';

const API    = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const LS_KEY = 'gyedi_fav_listings';

function loadLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
}
function saveLocal(ids: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch {}
}

interface Props {
  listingId: string;
  compact?:  boolean; // small overlay mode for listing cards
}

export default function FavouriteButton({ listingId, compact = false }: Props) {
  const [favourited, setFavourited] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (token) {
      fetch(`${API}/favourites/check/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => setFavourited(d.favourited ?? false))
        .catch(() => setFavourited(loadLocal().includes(listingId)));
    } else {
      setFavourited(loadLocal().includes(listingId));
    }
  }, [listingId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const next  = !favourited;
    setFavourited(next);

    // Keep localStorage in sync for offline/unauthenticated use
    const local = loadLocal();
    saveLocal(next ? [...local.filter(id => id !== listingId), listingId] : local.filter(id => id !== listingId));

    const token = localStorage.getItem('gyedi_token');
    if (token) {
      await fetch(`${API}/favourites/${listingId}`, {
        method: next ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  const bookmarkPath = 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z';

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={favourited ? 'Remove from saved' : 'Save listing'}
        className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all ${
          favourited
            ? 'bg-[#F5A623] text-white'
            : 'bg-white/90 text-gray-400 hover:text-[#F5A623]'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill={favourited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={bookmarkPath} />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      title={favourited ? 'Remove from saved' : 'Save listing'}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm border transition-all ${
        favourited
          ? 'bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F5A623]'
          : 'bg-white border-gray-200 text-gray-600 hover:border-[#F5A623]/40 hover:text-[#F5A623]'
      }`}
    >
      <svg className="w-4 h-4" fill={favourited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={bookmarkPath} />
      </svg>
      {favourited ? 'Saved' : 'Save'}
    </button>
  );
}
