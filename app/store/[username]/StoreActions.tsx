'use client';

import { useEffect, useState } from 'react';
import ShareModal from '@/components/ShareModal';

const API    = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const FAV_KEY = 'gyedi_fav_stores';

function loadFavs(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'); } catch { return []; }
}

export default function StoreActions({ sellerId, storeName }: { sellerId: string; storeName: string }) {
  const [following,  setFollowing]  = useState(false);
  const [acting,     setActing]     = useState(false);
  const [ready,      setReady]      = useState(false);
  const [notified,   setNotified]   = useState(false);
  const [favourited, setFavourited] = useState(false);
  const [showShare,  setShowShare]  = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    fetch(`${API}/social/follow/${sellerId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setFollowing(d.following ?? false))
      .catch(() => {})
      .finally(() => setReady(true));

    setFavourited(loadFavs().includes(sellerId));
  }, [sellerId]);

  async function toggleFollow() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { alert('Please sign in to follow stores.'); return; }
    setActing(true);
    try {
      const res = await fetch(`${API}/social/follow/${sellerId}`, {
        method: following ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setFollowing(data.following);
    } catch {}
    setActing(false);
  }

  function toggleFavourite() {
    const favs = loadFavs();
    const next = favs.includes(sellerId)
      ? favs.filter(id => id !== sellerId)
      : [...favs, sellerId];
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    setFavourited(next.includes(sellerId));
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Follow */}
        <button
          onClick={toggleFollow}
          disabled={acting || !ready}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50 ${
            following
              ? 'bg-[#1B4332] text-white hover:bg-[#0F2B1F]'
              : 'bg-white text-[#1B4332] border-2 border-[#1B4332] hover:bg-[#1B4332]/5'
          }`}
        >
          {following ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
          {following ? 'Following' : 'Follow'}
        </button>

        {/* Favourite heart */}
        <button
          onClick={toggleFavourite}
          title={favourited ? 'Remove from favourites' : 'Save to favourites'}
          className={`p-2.5 rounded-xl border transition-all ${
            favourited
              ? 'bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F5A623]'
              : 'bg-white border-gray-200 text-gray-400 hover:text-[#F5A623] hover:border-[#F5A623]/40'
          }`}
        >
          <svg className="w-5 h-5" fill={favourited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Share */}
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>

        {/* Notify bell */}
        <button
          onClick={() => setNotified(n => !n)}
          title={notified ? 'Turn off notifications' : 'Get notified of new listings'}
          className={`p-2.5 rounded-xl border transition-all ${
            notified
              ? 'bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F5A623]'
              : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
          }`}
        >
          <svg className="w-5 h-5" fill={notified ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>

      {showShare && (
        <ShareModal
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={`${storeName} on Gyedi`}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
