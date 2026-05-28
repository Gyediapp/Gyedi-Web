'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FlashDeal {
  id: string;
  title: string;
  price: string;
  images: string[];
  category: string;
  flashDealExpiry: string; // ISO date string
  seller: { id: string; firstName: string; lastName: string };
}

function Countdown({ expiry }: { expiry: string }) {
  const [diff, setDiff] = useState(() => Math.max(0, new Date(expiry).getTime() - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      setDiff(Math.max(0, new Date(expiry).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [expiry]);

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (diff === 0) return <span className="text-red-500 font-black text-xs">Expired</span>;

  return (
    <span className="font-black text-xs tabular-nums text-[#1B4332]">
      {h > 0 && `${pad(h)}:`}{pad(m)}:{pad(s)}
    </span>
  );
}

export default function FlashDealsSection({ deals }: { deals: FlashDeal[] }) {
  if (!deals.length) return null;

  return (
    <section className="py-10 md:py-16 bg-[#1B4332]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-5 md:mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#F5A623] text-[#1B4332] text-[11px] font-black px-3 py-1 rounded-full mb-2 uppercase tracking-wider animate-pulse">
              ⚡ Flash Deals
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Limited Time Offers</h2>
            <p className="text-white/50 text-sm mt-1">Grab them before they&apos;re gone</p>
          </div>
          <Link href="/marketplace?flash=1" className="text-[#F5A623] font-bold text-sm hover:underline flex-shrink-0 ml-4">
            See all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {deals.map(deal => {
            const img  = deal.images?.[0];
            const name = `${deal.seller.firstName} ${deal.seller.lastName}`;

            return (
              <Link
                key={deal.id}
                href={`/listing/${deal.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="relative aspect-square bg-gray-100">
                  {img ? (
                    <img src={img} alt={deal.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🔥</div>
                  )}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    FLASH
                  </div>
                </div>

                <div className="p-3">
                  <p className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">{deal.title}</p>
                  <p className="text-[#1B4332] font-black text-base mt-1">
                    GHS {parseFloat(deal.price).toLocaleString()}
                  </p>

                  {/* Countdown */}
                  <div className="mt-2 flex items-center justify-between bg-red-50 rounded-lg px-2 py-1">
                    <span className="text-red-400 text-[10px] font-semibold">Ends in</span>
                    <Countdown expiry={deal.flashDealExpiry} />
                  </div>

                  <p className="text-gray-400 text-[11px] mt-1.5 truncate">{name}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
