'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api.up.railway.app';

export default function FollowButton({ sellerId }: { sellerId: string }) {
  const [following, setFollowing] = useState(false);
  const [count,     setCount]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gyedi_token') : null;
    fetch(`${API}/api/social/follow/${sellerId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { setFollowing(d.following ?? false); setCount(d.count ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  async function toggle() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { alert('Please sign in to follow stores.'); return; }
    setActing(true);
    const method = following ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`${API}/api/social/follow/${sellerId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
        setCount(prev => data.following ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {}
    setActing(false);
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={acting}
      className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl border transition-all ${
        following
          ? 'bg-[#1B4332] text-white border-[#1B4332] hover:bg-[#0F2B1F]'
          : 'bg-white text-[#1B4332] border-[#1B4332] hover:bg-[#1B4332]/5'
      } disabled:opacity-60`}
    >
      {following ? '✓ Following' : '+ Follow'}
      <span className="text-xs font-normal opacity-70">{count > 0 ? `· ${count}` : ''}</span>
    </button>
  );
}
