'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StoreOwnerBar({ sellerId }: { sellerId: string }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gyedi_user');
      if (stored) {
        const u = JSON.parse(stored) as { id: string };
        setIsOwner(u.id === sellerId);
      }
    } catch {}
  }, [sellerId]);

  if (!isOwner) return null;

  return (
    <>
      {/* Fixed owner banner */}
      <div className="fixed top-0 inset-x-0 z-50 bg-[#1B4332] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="text-green-300 text-xs font-semibold">👁 You&apos;re viewing your store</span>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="text-white/80 hover:text-white text-xs font-semibold transition-colors"
            >
              Edit Store
            </Link>
            <span className="text-white/30 text-xs">·</span>
            <Link
              href="/my-listings"
              className="text-white/80 hover:text-white text-xs font-semibold transition-colors"
            >
              Manage Listings
            </Link>
            <Link
              href="/sell"
              className="bg-[#F5A623] text-[#1B4332] font-black text-xs px-3 py-1.5 rounded-lg hover:bg-[#e09520] transition-colors"
            >
              + Add Listing
            </Link>
          </div>
        </div>
      </div>

      {/* Spacer so page content clears the fixed banner */}
      <div className="h-10" />

      {/* Floating Add Listing button (mobile-friendly) */}
      <Link
        href="/sell"
        className="fixed bottom-6 right-5 z-40 flex items-center gap-2 bg-[#F5A623] text-[#1B4332] font-black text-sm px-5 py-3.5 rounded-2xl shadow-2xl shadow-[#F5A623]/40 hover:bg-[#e09520] transition-all active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Listing
      </Link>
    </>
  );
}
