'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import LikeButton from '@/components/LikeButton';
import FavouriteButton from '@/components/FavouriteButton';

export interface StoreProduct {
  id: string;
  title: string;
  price: string;
  images: string[];
  category: string;
  condition?: string;
}

const CARD_GAP = 12;

export default function StoreProductCarousel({
  listings,
  sellerRating,
}: {
  listings: StoreProduct[];
  sellerRating?: number | null;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[0] as HTMLElement | null;
    const w    = card ? card.offsetWidth + CARD_GAP : 256;
    track.scrollBy({ left: dir * w, behavior: 'smooth' });
  }, []);

  if (listings.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-5xl mb-3">📦</p>
        <p className="font-bold text-gray-800 text-lg">No active listings yet</p>
        <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="relative group/carousel -mx-1 px-1">

      {/* Desktop: left arrow */}
      <button
        onClick={() => scroll(-1)}
        aria-label="Previous"
        className="hidden sm:flex absolute left-0 top-[40%] -translate-y-1/2 -translate-x-5 z-10
                   w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100
                   items-center justify-center text-gray-600
                   hover:bg-[#1B4332] hover:text-[#F5A623] hover:border-[#1B4332]
                   transition-all duration-200
                   opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Scroll track */}
      <div
        ref={trackRef}
        className="store-product-track flex gap-3 overflow-x-auto pb-4 -mb-4"
        style={{
          scrollSnapType:          'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth:          'none',
          msOverflowStyle:         'none',
        } as React.CSSProperties}
      >
        <style>{'.store-product-track::-webkit-scrollbar{display:none}'}</style>

        {listings.map((l) => {
          const thumb = l.images[0] ?? null;
          const price = parseFloat(l.price).toLocaleString('en-GH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <div
              key={l.id}
              className="flex-shrink-0 w-[72vw] sm:w-52 md:w-56 lg:w-60"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative group/card bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">

                {/* Image */}
                <Link href={`/listing/${l.id}`} tabIndex={-1} aria-hidden className="block relative">
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={l.title}
                        draggable={false}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300 select-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Condition badge */}
                    {l.condition && (
                      <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm pointer-events-none ${
                        l.condition === 'USED' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {l.condition}
                      </span>
                    )}

                    {/* Price gradient overlay at bottom of image */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 pt-8 pb-2.5 pointer-events-none">
                      <p className="text-white font-black text-sm tabular-nums">GH₵ {price}</p>
                    </div>
                  </div>
                </Link>

                {/* Card body */}
                <Link href={`/listing/${l.id}`} className="flex-1 block px-3 pt-2.5 pb-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">
                    {l.category}
                  </p>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {l.title}
                  </h3>
                  {sellerRating != null && (
                    <p className="text-[11px] mt-1.5 flex items-center gap-1">
                      <span className="text-[#F5A623]">
                        {'★'.repeat(Math.round(sellerRating))}
                        <span className="text-gray-200">{'★'.repeat(5 - Math.round(sellerRating))}</span>
                      </span>
                      <span className="text-gray-400 font-medium">{sellerRating.toFixed(1)}</span>
                    </p>
                  )}
                </Link>

                {/* Like + Save overlays */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
                  <LikeButton      listingId={l.id} compact />
                  <FavouriteButton listingId={l.id} compact />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: right arrow */}
      <button
        onClick={() => scroll(1)}
        aria-label="Next"
        className="hidden sm:flex absolute right-0 top-[40%] -translate-y-1/2 translate-x-5 z-10
                   w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100
                   items-center justify-center text-gray-600
                   hover:bg-[#1B4332] hover:text-[#F5A623] hover:border-[#1B4332]
                   transition-all duration-200
                   opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Mobile scroll hint dots */}
      {listings.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3 sm:hidden pointer-events-none">
          {listings.slice(0, Math.min(listings.length, 8)).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          ))}
          {listings.length > 8 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300 opacity-40" />}
        </div>
      )}
    </div>
  );
}
