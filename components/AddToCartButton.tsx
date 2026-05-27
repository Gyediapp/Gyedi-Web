'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface Props {
  listingId:  string;
  title:      string;
  price:      number;
  image:      string | null;
  sellerId:   string;
  sellerName: string;
  condition?: string;
}

export default function AddToCartButton({ listingId, title, price, image, sellerId, sellerName, condition }: Props) {
  const { addItem, removeItem, isInCart } = useCart();
  const [flash, setFlash] = useState(false);
  const inCart = isInCart(listingId);

  function handle() {
    if (inCart) {
      removeItem(listingId);
    } else {
      addItem({ id: listingId, title, price, image, sellerId, sellerName, condition });
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
  }

  if (flash) {
    return (
      <Link
        href="/cart"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm bg-green-50 border border-green-200 text-green-700 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Added! View Cart
      </Link>
    );
  }

  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm border transition-all ${
        inCart
          ? 'bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F5A623]'
          : 'bg-white border-gray-200 text-gray-600 hover:border-[#1B4332]/40 hover:text-[#1B4332]'
      }`}
    >
      <svg className="w-4 h-4" fill={inCart ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {inCart ? 'In Cart' : 'Add to Cart'}
    </button>
  );
}
