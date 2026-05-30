'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

export default function FollowerCount({ sellerId }: { sellerId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gyedi_token') : null;
    fetch(`${API}/social/follow/${sellerId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, [sellerId]);

  if (count === null) {
    return <span className="text-xl sm:text-2xl font-black text-gray-300 animate-pulse">—</span>;
  }
  return (
    <span className="text-xl sm:text-2xl font-black text-gray-900">{count.toLocaleString()}</span>
  );
}
