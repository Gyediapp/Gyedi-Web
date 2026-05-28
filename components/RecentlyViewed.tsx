'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const KEY = 'gyedi_recently_viewed';

interface RVListing {
  id: string;
  title: string;
  price: string;
  images: string[];
  category: string;
}

export default function RecentlyViewed({ currentId }: { currentId?: string }) {
  const [items, setItems] = useState<RVListing[]>([]);

  useEffect(() => {
    try {
      const raw  = localStorage.getItem(KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const filtered = ids.filter(id => id !== currentId).slice(0, 8);
      if (!filtered.length) return;

      fetch(`/api/listings/batch?ids=${filtered.join(',')}`)
        .then(r => r.ok ? r.json() : [])
        .then((data: RVListing[]) => {
          // preserve localStorage order
          const map = new Map(data.map(d => [d.id, d]));
          setItems(filtered.map(id => map.get(id)!).filter(Boolean));
        })
        .catch(() => {});
    } catch {
      // localStorage unavailable
    }
  }, [currentId]);

  if (!items.length) return null;

  return (
    <section className="py-8 md:py-12 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-4">Recently Viewed</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {items.map(item => {
            const img = item.images?.[0];
            return (
              <Link
                key={item.id}
                href={`/listing/${item.id}`}
                className="flex-shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-square bg-gray-100">
                  {img ? (
                    <img src={img} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{item.title}</p>
                  <p className="text-xs font-black text-[#1B4332] mt-1">GHS {parseFloat(item.price).toLocaleString()}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
