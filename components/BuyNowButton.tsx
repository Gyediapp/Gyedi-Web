'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

export default function BuyNowButton({
  sellerPhone,
  listingTitle,
  amount,
}: {
  sellerPhone: string;
  listingTitle: string;
  amount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleBuy() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/escrows`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title: listingTitle, sellerPhone, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to create escrow');
      window.location.href = `/escrow/${data.escrow.id}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-60 text-[#1B4332] font-black py-3.5 rounded-xl transition-colors text-base"
      >
        {loading ? 'Creating Escrow…' : 'Buy with Gyedi Escrow →'}
      </button>
      <p className="text-white/50 text-xs text-center">
        Not signed in?{' '}
        <a href="/login" className="text-white/70 underline">Log in first</a>
      </p>
    </div>
  );
}
