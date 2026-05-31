'use client';

import Link from 'next/link';
import FavouriteButton from '@/components/FavouriteButton';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface ListingCardProps {
  id:           string;
  title:        string;
  price:        string | number;
  images:       string[];
  category:     string;
  country:      string;
  storeType:    string;
  views:        number;
  sellerName:   string;
  sellerId:     string;
  sellerRating?: number | null;
  condition?:   string;
  boosted?:     boolean;
}

const COUNTRY_FLAG: Record<string, string> = {
  GH: '🇬🇭', NG: '🇳🇬', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', US: '🇺🇸', SN: '🇸🇳', CI: '🇨🇮',
};

export default function ListingCard({
  id, title, price, images, category, country,
  storeType, views, sellerName, sellerId, sellerRating, condition, boosted,
}: ListingCardProps) {
  const { addItem, removeItem, isInCart } = useCart();
  const [flash, setFlash] = useState(false);
  const thumb  = images[0] ?? null;
  const inCart = isInCart(id);
  const numPrice = parseFloat(price.toString());

  function handleCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      removeItem(id);
    } else {
      addItem({ id, title, price: numPrice, image: thumb, sellerName, sellerId, condition });
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
  }

  return (
    <Link
      href={`/listing/${id}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Sponsored badge */}
        {boosted && (
          <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623] text-[#1B4332] shadow-sm">
            ⚡ Sponsored
          </span>
        )}

        {/* Condition badge */}
       {condition && (
          <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
            condition === 'New' ? 'bg-green-100 text-green-700' :
            condition === 'Like New' ? 'bg-emerald-100 text-emerald-700' :
            condition === 'Good' ? 'bg-blue-100 text-blue-700' :
            condition === 'Fair' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {condition}
          </span>
        )}
        {/* Store type badge */}
        {storeType !== 'BASIC' && (
          <span className={`absolute top-2.5 ${condition ? 'right-2.5' : 'left-2.5'} text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
            storeType === 'BUSINESS'
              ? 'bg-[#1B4332] text-white'
              : 'bg-[#F5A623] text-[#1B4332]'
          }`}>
            {storeType === 'BUSINESS' ? '✦ Business' : '★ Pro'}
          </span>
        )}

        {/* Favourite heart — top right */}
        <div className="absolute top-2.5 right-2.5">
          <FavouriteButton listingId={id} compact />
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <p className="text-xs text-gray-400 font-medium mb-1">
          {category} · {COUNTRY_FLAG[country] ?? '🌍'}
        </p>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#1B4332] transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-1.5 sm:mt-2">
          <p className="text-[#1B4332] font-black text-base sm:text-lg">
            GHS {numPrice.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {/* Cart toggle */}
          <button
            onClick={handleCart}
            title={inCart ? 'Remove from cart' : 'Add to cart'}
            className={`p-1.5 rounded-lg transition-all ${
              flash ? 'text-green-600' : inCart ? 'text-[#F5A623]' : 'text-gray-300 hover:text-[#1B4332]'
            }`}
          >
            {flash ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill={inCart ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium truncate max-w-[90px] sm:max-w-[110px]">{sellerName}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {sellerRating && (
              <span className="flex items-center gap-0.5 text-amber-500 font-bold text-xs sm:text-sm">
                ★ {parseFloat(sellerRating.toString()).toFixed(1)}
              </span>
            )}
            <span className="text-xs text-gray-400">{views}v</span>
          </div>
        </div>
        <div className="mt-3 w-full bg-[#1B4332] hover:bg-[#0F2B1F] group-hover:bg-[#0F2B1F] text-white text-[11px] sm:text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
          <svg className="w-3 h-3 text-[#F5A623] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          Buy Safely with Gyedi →
        </div>
      </div>
    </Link>
  );
}
