'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  price: string;
  images: string[];
  category: string;
  storeType: string;
  views: number;
  seller: { id: string; firstName: string; lastName: string; averageRating: string | null };
}

const TIER_BADGE: Record<string, string> = {
  PRO:        'bg-[#F5A623] text-[#1B4332]',
  BUSINESS:   'bg-[#1B4332] text-white',
  ENTERPRISE: 'bg-purple-700 text-white',
};

export default function ProductCarousel({ products }: { products: Product[] }) {
  const [idx, setIdx]     = useState(0);
  const [paused, setPaused] = useState(false);

  const visible = 4;
  const total   = products.length;

  const next = useCallback(() => {
    setIdx(i => (i + 1) % Math.max(total - visible + 1, 1));
  }, [total]);

  const prev = useCallback(() => {
    setIdx(i => (i - 1 + Math.max(total - visible + 1, 1)) % Math.max(total - visible + 1, 1));
  }, [total]);

  useEffect(() => {
    if (paused || total <= visible) return;
    const t = setInterval(next, 3000);
    return () => clearInterval(t);
  }, [paused, next, total]);

  if (!products.length) return null;

  const shown = Array.from({ length: Math.min(visible, total) }, (_, i) => products[(idx + i) % total]);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Arrows */}
      {total > visible && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-[#1B4332] hover:text-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-[#1B4332] hover:text-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {shown.map((p, i) => {
          const img    = p.images?.[0];
          const name   = `${p.seller.firstName} ${p.seller.lastName}`;
          const rating = p.seller.averageRating ? parseFloat(p.seller.averageRating) : null;
          const badge  = TIER_BADGE[p.storeType];

          return (
            <Link
              key={`${p.id}-${i}`}
              href={`/listing/${p.id}`}
              className="group/card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <div className="relative aspect-square bg-gray-100">
                {img ? (
                  <img src={img} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                )}
                {badge && (
                  <span className={`absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${badge}`}>
                    {p.storeType === 'PRO' ? '★ Pro' : p.storeType === 'BUSINESS' ? '✦ Biz' : '◆ Ent'}
                  </span>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  GHS {parseFloat(p.price).toLocaleString()}
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{p.title}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-gray-400 text-xs truncate">{name}</p>
                  {rating && (
                    <span className="text-amber-500 text-xs font-bold flex-shrink-0 ml-1">★ {rating.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dots */}
      {total > visible && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: total - visible + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${i === idx ? 'w-5 h-1.5 bg-[#1B4332]' : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
