'use client';

import Link from 'next/link';
import LikeButton from '@/components/LikeButton';

interface StoreListing {
  id: string;
  title: string;
  price: string;
  images: string[];
  category: string;
  condition?: string;
}

export default function StoreListingGrid({
  listings,
  accentColor = '#1B4332',
}: {
  listings: StoreListing[];
  accentColor?: string;
}) {
  if (listings.length === 0) {
    return (
      <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-5xl mb-3">📦</p>
        <p className="font-bold text-gray-800 text-lg">No active listings yet</p>
        <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
      </div>
    );
  }

  return (
    <>
      {listings.map(l => {
        const thumb = l.images[0] ?? null;
        const price = parseFloat(l.price).toLocaleString('en-GH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return (
          <div key={l.id} className="relative group">
            <Link
              href={`/listing/${l.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {l.condition && (
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                    l.condition === 'USED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {l.condition}
                  </span>
                )}
              </div>

              <div className="p-3 sm:p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {l.category}
                </p>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
                  {l.title}
                </h3>
                <p className="font-black text-base" style={{ color: accentColor }}>
                  GH₵ {price}
                </p>
              </div>
            </Link>

            {/* Like button overlaid top-right of image, outside the Link */}
            <div className="absolute top-2 right-2 z-10">
              <LikeButton listingId={l.id} compact />
            </div>
          </div>
        );
      })}
    </>
  );
}
