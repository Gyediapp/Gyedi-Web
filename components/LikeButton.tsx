'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api.up.railway.app';

export default function LikeButton({ listingId }: { listingId: string }) {
  const [liked,   setLiked]   = useState(false);
  const [count,   setCount]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gyedi_token') : null;
    fetch(`${API}/api/social/like/${listingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { setLiked(d.liked ?? false); setCount(d.count ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  async function toggle() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { alert('Please sign in to like listings.'); return; }
    setActing(true);
    const method = liked ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`${API}/api/social/like/${listingId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setCount(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {}
    setActing(false);
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={acting}
      className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
        liked
          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-red-500'
      } disabled:opacity-60`}
    >
      <svg className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400'}`} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {count > 0 ? count : ''} {liked ? 'Liked' : 'Like'}
    </button>
  );
}
