'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

export default function MessageSellerButton({
  sellerId,
  listingTitle,
  amount,
}: {
  sellerId: string;
  listingTitle: string;
  amount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleMessage() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/escrows`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title: listingTitle, sellerId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not start chat');
      window.location.href = `/escrow/${data.escrow.id}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      <button
        onClick={handleMessage}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1B4332] text-[#1B4332] text-sm font-bold hover:bg-[#1B4332] hover:text-white transition-colors disabled:opacity-50 w-full justify-center"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {loading ? 'Opening chat…' : 'Message Seller'}
      </button>
    </div>
  );
}
