'use client';

import Link from 'next/link';

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  storeName: string | null;
  avatarUrl: string | null;
  storeType: string;
  averageRating: string | null;
  _count: { listings: number };
}

const RING: Record<string, string> = {
  PRO:        'ring-[#F5A623]',
  BUSINESS:   'ring-[#1B4332]',
  ENTERPRISE: 'ring-purple-500',
};

const TIER_DOT: Record<string, string> = {
  PRO:        'bg-[#F5A623]',
  BUSINESS:   'bg-[#1B4332]',
  ENTERPRISE: 'bg-purple-500',
};

export default function SellerMosaic({ sellers }: { sellers: Seller[] }) {
  if (!sellers.length) return null;

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 md:gap-4">
      {sellers.map(s => {
        const name    = s.storeName || `${s.firstName} ${s.lastName}`;
        const initials = `${s.firstName[0]}${s.lastName[0]}`;
        const ring    = RING[s.storeType] ?? 'ring-gray-300';
        const dot     = TIER_DOT[s.storeType];
        const count   = s._count?.listings ?? 0;
        const rating  = s.averageRating ? parseFloat(s.averageRating).toFixed(1) : null;

        return (
          <Link
            key={s.id}
            href={`/store/${s.id}`}
            className="group flex flex-col items-center gap-2 text-center"
          >
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ${ring} overflow-hidden bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex-shrink-0 transition-all group-hover:scale-110 group-hover:shadow-lg`}>
              {s.avatarUrl ? (
                <img src={s.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-base sm:text-lg">
                  {initials}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                {rating && (
                  <span className="text-amber-400 text-[10px] font-bold">★ {rating}</span>
                )}
                <span className="text-white text-[9px]">{count} items</span>
              </div>
            </div>

            {dot && (
              <div className="relative -mt-3.5 flex justify-center">
                <span className={`w-2.5 h-2.5 rounded-full border-2 border-white ${dot}`} />
              </div>
            )}

            <p className="text-xs font-semibold text-gray-700 group-hover:text-[#1B4332] transition-colors leading-tight max-w-[60px] truncate">
              {name}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
