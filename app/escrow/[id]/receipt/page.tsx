'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const FEE_RATE = 0.015;

type Party = { id: string; firstName: string; lastName: string; phone: string };
type Escrow = {
  id: string; code: string; title: string; description?: string;
  amount: string; currency: string; status: string;
  buyerId: string; sellerId: string;
  dueDate?: string; releasedAt?: string; createdAt: string;
  buyerNote?: string; sellerNote?: string; sharedNote?: string;
  buyer: Party; seller: Party;
};

function fmt(amount: string | number) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GH', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [myId, setMyId]     = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const tok = localStorage.getItem('gyedi_token');
    if (!tok) { window.location.href = '/login'; return; }
    const stored = localStorage.getItem('gyedi_user');
    if (stored) setMyId(JSON.parse(stored).id);

    fetch(`${API}/escrows/${params.id}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; }
        return r.json();
      })
      .then(d => { setEscrow(d.escrow ?? null); if (!d.escrow) setError('Transaction not found'); })
      .catch(() => setError('Could not load receipt'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1B4332] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Receipt not found'}</p>
          <Link href="/history" className="text-[#1B4332] font-semibold text-sm">← Back to Transactions</Link>
        </div>
      </div>
    );
  }

  const isBuyer  = myId === escrow.buyerId;
  const amount   = parseFloat(escrow.amount);
  const fee      = amount * FEE_RATE;
  const total    = amount + fee;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-shadow { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F4F6F8] py-8 px-4">
        {/* Toolbar — hidden on print */}
        <div className="no-print max-w-lg mx-auto mb-4 flex items-center justify-between">
          <Link href={`/escrow/${escrow.id}`} className="flex items-center gap-1.5 text-sm text-[#1B4332] font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1B4332] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0F2B1F] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>

        {/* Receipt card */}
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg print-shadow overflow-hidden">
          {/* Header strip */}
          <div className="bg-[#1B4332] px-8 py-6 text-center">
            <p className="text-[#F5A623] font-black text-3xl tracking-tight">Gyedi</p>
            <p className="text-white/60 text-xs mt-0.5">Secure Escrow Service</p>
          </div>

          {/* Receipt title + code */}
          <div className="px-8 pt-6 pb-4 border-b border-dashed border-gray-200 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction Receipt</p>
            <p className="text-[#F5A623] font-black text-2xl tracking-widest">{escrow.code}</p>
            <p className="text-gray-400 text-xs mt-1">{fmtDateTime(escrow.releasedAt ?? escrow.createdAt)}</p>
          </div>

          {/* Status */}
          <div className="px-8 py-4 border-b border-dashed border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              escrow.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {escrow.status}
            </span>
          </div>

          {/* Transaction details */}
          <div className="px-8 py-4 border-b border-dashed border-gray-200 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction</p>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Title</span>
              <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{escrow.title}</span>
            </div>
            {escrow.description && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Description</span>
                <span className="text-sm text-gray-600 text-right max-w-[60%]">{escrow.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Created</span>
              <span className="text-sm text-gray-600">{fmtDate(escrow.createdAt)}</span>
            </div>
            {escrow.releasedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Released</span>
                <span className="text-sm text-gray-600">{fmtDate(escrow.releasedAt)}</span>
              </div>
            )}
          </div>

          {/* Parties */}
          <div className="px-8 py-4 border-b border-dashed border-gray-200 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Parties</p>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Buyer</span>
              <span className="text-sm font-semibold text-gray-800">
                {escrow.buyer.firstName} {escrow.buyer.lastName}
                {isBuyer && <span className="ml-1 text-xs text-[#1B4332] font-bold">(You)</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Seller</span>
              <span className="text-sm font-semibold text-gray-800">
                {escrow.seller.firstName} {escrow.seller.lastName}
                {!isBuyer && <span className="ml-1 text-xs text-[#1B4332] font-bold">(You)</span>}
              </span>
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="px-8 py-4 border-b border-dashed border-gray-200 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount</p>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Escrow amount</span>
              <span className="text-sm text-gray-800">{fmt(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Service fee (1.5%)</span>
              <span className="text-sm text-gray-500">{fmt(fee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-800">{isBuyer ? 'Total charged' : 'Total received'}</span>
              <span className="text-sm font-black text-[#1B4332]">{fmt(isBuyer ? total : amount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 text-center space-y-1.5">
            <p className="text-xs text-gray-400">This is an official Gyedi transaction receipt.</p>
            <p className="text-xs text-gray-400">Gyedi · Secure Escrow Marketplace · gyedi.com</p>
            <p className="text-[10px] text-gray-300 mt-2">Ref: {escrow.id}</p>
          </div>
        </div>
      </div>
    </>
  );
}
