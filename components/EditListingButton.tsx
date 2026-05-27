'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  listingId: string;
  sellerId:  string;
}

export default function EditListingButton({ listingId, sellerId }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('gyedi_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.sub === sellerId) setShow(true);
    } catch {}
  }, [sellerId]);

  if (!show) return null;

  return (
    <Link
      href={`/listing/${listingId}/edit`}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4332] bg-[#1B4332]/8 hover:bg-[#1B4332]/15 px-4 py-2 rounded-xl transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Edit Listing
    </Link>
  );
}
