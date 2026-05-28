'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Store {
  id: string; firstName: string; lastName: string;
  storeName: string | null; storeBanner: string | null;
  storeType: string; storeTheme: string;
  averageRating: string | null; totalRatings: number;
  _count: { listings: number };
  storeCategory?: string | null;
}

const THEME_BG: Record<string, string> = {
  Bold:         'from-[#1B4332] to-[#0F2B1F]',
  Warm:         'from-amber-700 to-orange-900',
  Professional: 'from-slate-700 to-slate-900',
  Minimal:      'from-gray-600 to-gray-800',
};
const TIER: Record<string, { label: string; cls: string }> = {
  PRO:        { label: '★ Pro',        cls: 'bg-[#F5A623] text-[#1B4332]' },
  BUSINESS:   { label: '✦ Business',   cls: 'bg-[#1B4332] text-white' },
  ENTERPRISE: { label: '◆ Enterprise', cls: 'bg-purple-700 text-white' },
};

export default function StoreCarousel({ stores }: { stores: Store[] }) {
  const [paused, setPaused] = useState(false);
  if (!stores.length) return null;

  // Duplicate until we have at least 8 items for a smooth loop
  const fill   = stores.length < 5 ? 4 : 2;
  const items  = Array.from({ length: fill }, () => stores).flat();
  // CSS animation moves -50% (for fill=2) or -25% (fill=4) etc
  const toVal  = 100 / fill;
  const dur    = Math.max(stores.length * 7, 35);

  return (
    <div className="relative overflow-hidden">
      <style>{`@keyframes gyedi-store-scroll{from{transform:translateX(0)}to{transform:translateX(-${toVal}%)}}`}</style>

      {/* Fade edge masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-4 pb-2"
        style={{
          animation:           `gyedi-store-scroll ${dur}s linear infinite`,
          animationPlayState:  paused ? 'paused' : 'running',
          width:               'max-content',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {items.map((store, idx) => {
          const bg    = THEME_BG[store.storeTheme] ?? THEME_BG.Bold;
          const name  = store.storeName || `${store.firstName} ${store.lastName}`;
          const init  = `${store.firstName[0]}${store.lastName[0]}`;
          const tier  = TIER[store.storeType];
          const count = store._count?.listings ?? 0;

          return (
            <Link
              key={`${store.id}-${idx}`}
              href={`/store/${store.id}`}
              className="group flex-shrink-0 w-56 sm:w-64 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              {/* Banner */}
              <div className={`relative h-28 bg-gradient-to-br ${bg} flex items-end p-4`}>
                {store.storeBanner && (
                  <img src={store.storeBanner} alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                {tier && (
                  <span className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2 py-0.5 rounded-full ${tier.cls}`}>
                    {tier.label}
                  </span>
                )}
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {init}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate max-w-[130px]">{name}</p>
                    {store.storeCategory && (
                      <p className="text-white/50 text-xs truncate">{store.storeCategory}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  {store.averageRating && (
                    <span className="text-amber-500 font-bold">★ {parseFloat(store.averageRating).toFixed(1)}</span>
                  )}
                  {store.averageRating && <span>·</span>}
                  <span>{count} listing{count !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-[#1B4332] text-xs font-bold group-hover:underline flex-shrink-0">Visit →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
