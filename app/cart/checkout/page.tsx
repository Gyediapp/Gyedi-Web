'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/context/CartContext';

const API      = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const FEE_RATE = 0.015;

function fmt(n: number) {
  return n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface EscrowResult {
  sellerId:    string;
  sellerName:  string;
  code:        string;
  amount:      number;
  items:       CartItem[];
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [placing,   setPlacing]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [results,   setResults]   = useState<EscrowResult[] | null>(null);

  // Group by seller
  const bySeller = items.reduce<Record<string, CartItem[]>>((acc, item) => {
    (acc[item.sellerId] = acc[item.sellerId] ?? []).push(item);
    return acc;
  }, {});

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const fee      = subtotal * FEE_RATE;
  const total    = subtotal + fee;

  async function placeOrders() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { setError('Please sign in to place an order.'); return; }
    if (items.length === 0) return;

    setPlacing(true);
    setError(null);

    const out: EscrowResult[] = [];

    for (const [sellerId, sellerItems] of Object.entries(bySeller)) {
      const sellerName   = sellerItems[0].sellerName;
      const sellerTotal  = sellerItems.reduce((s, i) => s + i.price, 0);
      const title        = sellerItems.length === 1
        ? sellerItems[0].title
        : `Marketplace Order: ${sellerItems.map(i => i.title).join(', ')}`;
      const description  = sellerItems
        .map(i => `${i.title} — GHS ${fmt(i.price)}`)
        .join('\n');

      try {
        const res = await fetch(`${API}/escrows`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ sellerId, title, description, amount: sellerTotal }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? `Failed to create escrow for ${sellerName}`);
        }
        const data = await res.json();
        out.push({ sellerId, sellerName, code: data.escrow?.code ?? '—', amount: sellerTotal, items: sellerItems });
      } catch (err: any) {
        setError(err.message ?? 'Something went wrong. Please try again.');
        setPlacing(false);
        return;
      }
    }

    clearCart();
    setResults(out);
    setPlacing(false);
  }

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (results) {
    const grandTotal = results.reduce((s, r) => s + r.amount, 0);
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full space-y-5">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">Orders Placed!</h1>
            <p className="text-gray-500 text-sm">
              {results.length === 1 ? 'Your escrow has' : `${results.length} escrows have`} been created. Sellers have been notified.
            </p>
          </div>

          {results.map(r => (
            <div key={r.code} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Seller: {r.sellerName}</p>
                  <p className="font-black text-[#1B4332] text-sm">Escrow #{r.code}</p>
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Pending</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                {r.items.map(i => (
                  <li key={i.id} className="flex justify-between">
                    <span className="truncate max-w-[200px]">{i.title}</span>
                    <span className="font-semibold shrink-0 ml-2">GHS {fmt(i.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-black text-gray-900">
                <span>Subtotal</span>
                <span>GHS {fmt(r.amount)}</span>
              </div>
            </div>
          ))}

          <div className="bg-[#1B4332] rounded-2xl p-5 text-white">
            <div className="flex justify-between mb-1">
              <span className="text-white/70 text-sm">Total incl. escrow fees</span>
              <span className="font-black">GHS {fmt(grandTotal * (1 + FEE_RATE))}</span>
            </div>
            <p className="text-white/50 text-xs">Your payments are held safely until you confirm receipt of each item.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/history" className="flex-1 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black py-3.5 rounded-xl text-center transition-colors">
              View My Orders
            </Link>
            <Link href="/marketplace" className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-center hover:border-gray-300 transition-colors">
              Keep Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link href="/marketplace" className="bg-[#1B4332] text-white font-bold px-7 py-3 rounded-xl">Browse Marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <div className="bg-[#1B4332] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/cart" className="text-white/60 hover:text-white text-sm font-medium mb-2 inline-flex items-center gap-1 transition-colors">
            ← Back to cart
          </Link>
          <h1 className="text-3xl font-black text-white">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Grouped by seller */}
        {Object.entries(bySeller).map(([sellerId, sellerItems]) => {
          const sellerTotal = sellerItems.reduce((s, i) => s + i.price, 0);
          return (
            <div key={sellerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/70 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Order from {sellerItems[0].sellerName}
                </p>
                <span className="text-xs font-semibold text-[#1B4332] bg-green-50 px-2.5 py-1 rounded-full">1 escrow</span>
              </div>
              <div className="divide-y divide-gray-50">
                {sellerItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</p>
                      {item.condition && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.condition === 'USED' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{item.condition}</span>
                      )}
                    </div>
                    <p className="font-black text-[#1B4332] shrink-0">GHS {fmt(item.price)}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Seller subtotal</span>
                <span className="font-bold text-gray-900">GHS {fmt(sellerTotal)}</span>
              </div>
            </div>
          );
        })}

        {/* Grand total & CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              <span>GHS {fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Gyedi Escrow Fee (1.5%)</span>
              <span>GHS {fmt(fee)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900 text-base">
              <span>Total</span>
              <span>GHS {fmt(total)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 font-medium">
            🔒 {Object.keys(bySeller).length === 1
              ? 'One escrow will be created. Your payment is held until you confirm receipt.'
              : `${Object.keys(bySeller).length} escrows will be created — one per seller. Each payment is held until you confirm receipt.`}
          </div>

          <button
            onClick={placeOrders}
            disabled={placing}
            className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-60 text-[#1B4332] font-black text-base py-4 rounded-xl transition-colors shadow-md shadow-[#F5A623]/20 flex items-center justify-center gap-2"
          >
            {placing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Escrows…
              </>
            ) : (
              <>🔒 Place {Object.keys(bySeller).length === 1 ? 'Order' : `${Object.keys(bySeller).length} Orders`}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
