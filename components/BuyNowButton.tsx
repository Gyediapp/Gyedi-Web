'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [escrowId,  setEscrowId]  = useState<string | null>(null);

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
      setEscrowId(data.escrow.id);
      // redirect after a short pause so the user sees the success state
      setTimeout(() => { window.location.href = `/escrow/${data.escrow.id}`; }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
      setLoading(false);
    }
  }

  // Success state — escrow created, auto-redirecting
  if (escrowId) {
    return (
      <div className="space-y-3">
        <div className="bg-green-800/40 border border-green-400/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-green-200 font-bold text-sm">Escrow created!</p>
            <p className="text-green-400/80 text-xs">Taking you to your transaction…</p>
          </div>
          <div className="ml-auto w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketplace"
            className="flex-1 text-center text-white/60 hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          >
            ← Continue Shopping
          </Link>
          <Link
            href={`/escrow/${escrowId}`}
            className="flex-1 text-center bg-[#F5A623] text-[#1B4332] text-xs font-bold py-2.5 rounded-xl transition-colors hover:bg-[#D4881A]"
          >
            View Escrow →
          </Link>
        </div>
      </div>
    );
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
