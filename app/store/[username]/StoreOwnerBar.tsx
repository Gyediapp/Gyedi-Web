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

    </>
  );
}
