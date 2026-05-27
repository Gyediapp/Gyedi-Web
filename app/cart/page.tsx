'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, removeItem, subtotal, clearCart } = useCart();

  const FEE_RATE = 0.015;
  const fee      = subtotal * FEE_RATE;
  const total    = subtotal + fee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 text-sm mb-6">Browse the marketplace and add listings you want to buy.</p>
          <Link href="/marketplace" className="bg-[#1B4332] text-white font-bold px-8 py-3 rounded-xl text-base transition-colors hover:bg-[#0F2B1F]">
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Group by seller
  const bySeller = items.reduce<Record<string, typeof items[0][]>>((acc, item) => {
    (acc[item.sellerId] = acc[item.sellerId] ?? []).push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Header */}
      <div className="bg-[#1B4332] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Ready to buy?</p>
          <h1 className="text-3xl font-black text-white">Your Cart</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Items grouped by seller */}
        {Object.entries(bySeller).map(([sellerId, sellerItems]) => (
          <div key={sellerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/70">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Seller: {sellerItems[0].sellerName}
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {sellerItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/listing/${item.id}`} className="font-semibold text-gray-900 text-sm leading-snug hover:text-[#1B4332] line-clamp-2">
                      {item.title}
                    </Link>
                    {item.condition && (
                      <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.condition === 'USED' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.condition}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-[#1B4332]">
                      GHS {item.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-black text-gray-900">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              <span>GHS {subtotal.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Gyedi Escrow Fee (1.5%)</span>
              <span>GHS {fee.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900 text-base">
              <span>Total</span>
              <span>GHS {total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Escrow notice */}
          <div className="bg-[#1B4332]/5 rounded-xl p-3 flex gap-2.5 mt-1">
            <span className="text-[#F5A623] text-lg shrink-0">🔒</span>
            <p className="text-xs text-[#1B4332] leading-relaxed font-medium">
              Each order is protected by Gyedi Escrow. Your payment is held safely until you confirm receipt.
              {Object.keys(bySeller).length > 1 && (
                <> One escrow will be created per seller ({Object.keys(bySeller).length} total).</>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/cart/checkout"
              className="flex-1 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black text-base py-3.5 rounded-xl text-center transition-colors shadow-md shadow-[#F5A623]/20"
            >
              Checkout with Escrow
            </Link>
            <button
              onClick={clearCart}
              className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:border-red-200 hover:text-red-500 transition-colors"
            >
              Clear cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
