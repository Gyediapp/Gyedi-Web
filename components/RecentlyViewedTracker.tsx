'use client';

import { useEffect } from 'react';

const KEY    = 'gyedi_recently_viewed';
const MAX_RV = 12;

export default function RecentlyViewedTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    try {
      const raw  = localStorage.getItem(KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [listingId, ...list.filter(id => id !== listingId)].slice(0, MAX_RV);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — no-op
    }
  }, [listingId]);

  return null;
}
