'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const FEE_RATE = 0.015;

type Party = { id: string; firstName: string; lastName: string; phone: string; averageRating?: string; totalRatings?: number };
type Dispute = { id: string; reason: string; status: string; createdAt: string };
type Escrow = {
  id: string; code: string; title: string; description?: string;
  amount: string; currency: string; status: string;
  buyerId: string; sellerId: string;
  dueDate?: string; releasedAt?: string; createdAt: string;
  buyerNote?: string; sellerNote?: string; sharedNote?: string;
  buyer: Party; seller: Party;
  disputes: Dispute[];
};

function fmt(amount: string | number) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Status tracker config ──────────────────────────────────────────────────

const STEPS = [
  { key: 'FUNDED',      label: 'Funded',    desc: 'Funds held in escrow' },
  { key: 'IN_TRANSIT',  label: 'Shipped',   desc: 'Item on the way' },
  { key: 'COMPLETED',   label: 'Delivered', desc: 'Receipt confirmed' },
];

const STATUS_ORDER: Record<string, number> = {
  FUNDED: 0, IN_TRANSIT: 1, COMPLETED: 2, DISPUTED: -1, CANCELLED: -1, PENDING: -1,
};

function StatusTracker({ status }: { status: string }) {
  const current = STATUS_ORDER[status] ?? 0;
  const isDisputed = status === 'DISPUTED';

  if (isDisputed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-red-700 font-bold text-sm">Dispute Opened</p>
          <p className="text-red-500 text-xs mt-0.5">Under review by Gyedi support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between relative">
        {/* connector line */}
        <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-100 -z-0" />
        <div
          className="absolute left-5 top-5 h-0.5 bg-[#1B4332] -z-0 transition-all duration-500"
          style={{ width: current === 0 ? '0%' : current === 1 ? '50%' : '100%' }}
        />

        {STEPS.map((step, i) => {
          const done    = i < current;
          const active  = i === current;
          const locked  = i > current;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                done   ? 'bg-[#1B4332]' :
                active ? 'bg-[#F5A623] ring-4 ring-[#F5A623]/20' :
                         'bg-gray-100'
              }`}>
                {done ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-xs font-bold ${active ? 'text-white' : locked ? 'text-gray-300' : 'text-gray-500'}`}>{i + 1}</span>
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold ${done || active ? 'text-gray-800' : 'text-gray-300'}`}>{step.label}</p>
                <p className={`text-[10px] ${done || active ? 'text-gray-400' : 'text-gray-200'}`}>{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Action buttons ─────────────────────────────────────────────────────────

function ActionPanel({
  escrow, myId, token, onRefresh,
}: {
  escrow: Escrow; myId: string; token: string; onRefresh: () => void;
}) {
  const [loading, setLoading] = useState('');
  const [error, setError]     = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const isBuyer  = myId === escrow.buyerId;
  const isSeller = myId === escrow.sellerId;
  const { status } = escrow;

  async function action(path: string, method = 'PATCH', body?: object) {
    setLoading(path);
    setError('');
    try {
      const res  = await fetch(`${API}/escrows/${escrow.id}/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Action failed');
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading('');
    }
  }

  async function submitDispute() {
    if (disputeReason.length < 10) { setError('Please describe the issue (min 10 characters)'); return; }
    await action('dispute', 'POST', { reason: disputeReason });
    setShowDispute(false);
  }

  const btnBase = 'w-full font-bold py-3.5 rounded-2xl transition-all text-sm disabled:opacity-50 active:scale-[0.98]';

  if (status === 'COMPLETED') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-green-800 font-bold text-sm">Transaction Complete</p>
          <p className="text-green-600 text-xs mt-0.5">Funds released to seller</p>
        </div>
      </div>
    );
  }

  if (status === 'DISPUTED' || status === 'CANCELLED') return null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Seller actions */}
      {isSeller && status === 'FUNDED' && (
        <button
          onClick={() => action('ship')}
          disabled={!!loading}
          className={`${btnBase} bg-[#F5A623] text-white shadow-sm`}
        >
          {loading === 'ship' ? 'Updating…' : '📦 Mark as Shipped'}
        </button>
      )}

      {isSeller && status === 'IN_TRANSIT' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-blue-700 text-sm font-semibold">Waiting for buyer to confirm receipt</p>
          <p className="text-blue-500 text-xs mt-1">Funds will be released once confirmed</p>
        </div>
      )}

      {isSeller && status === 'FUNDED' && (
        <p className="text-center text-xs text-gray-400">Ship the item and mark it above once dispatched</p>
      )}

      {/* Buyer actions */}
      {isBuyer && status === 'FUNDED' && (
        <button
          onClick={() => action('release')}
          disabled={!!loading}
          className={`${btnBase} bg-white border-2 border-[#1B4332] text-[#1B4332]`}
        >
          {loading === 'release' ? 'Updating…' : 'Release to Seller Early'}
        </button>
      )}

      {isBuyer && status === 'IN_TRANSIT' && (
        <>
          <button
            onClick={() => action('confirm-receipt')}
            disabled={!!loading}
            className={`${btnBase} bg-[#1B4332] text-white shadow-sm`}
          >
            {loading === 'confirm-receipt' ? 'Confirming…' : '✅ Confirm Receipt & Release Funds'}
          </button>

          {!showDispute ? (
            <button
              onClick={() => setShowDispute(true)}
              className={`${btnBase} bg-white border border-gray-200 text-red-500`}
            >
              Open Dispute
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
              <p className="text-red-700 font-semibold text-sm">Describe the issue</p>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="What went wrong? Please provide details (min 10 characters)…"
                rows={3}
                className="w-full text-sm bg-white border border-red-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDispute(false); setDisputeReason(''); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDispute}
                  disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 disabled:opacity-50"
                >
                  {loading === 'dispute' ? 'Submitting…' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isBuyer && status === 'FUNDED' && (
        <p className="text-center text-xs text-gray-400">
          Funds are securely held. Release only when you&apos;ve received your item.
        </p>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function EscrowDetailPage() {
  const params = useParams<{ id: string }>();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [myId, setMyId]     = useState('');
  const [token, setToken]   = useState('');

  function load(tok: string) {
    setLoading(true);
    fetch(`${API}/escrows/${params.id}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('gyedi_token'); window.location.href = '/login'; }
        return r.json();
      })
      .then(d => { setEscrow(d.escrow ?? null); if (!d.escrow) setError('Escrow not found'); })
      .catch(() => setError('Could not load transaction'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const tok = localStorage.getItem('gyedi_token');
    if (!tok) { window.location.href = '/login'; return; }
    setToken(tok);
    const stored = localStorage.getItem('gyedi_user');
    if (stored) setMyId(JSON.parse(stored).id);
    load(tok);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const isBuyer  = escrow ? myId === escrow.buyerId  : false;
  const fee      = escrow ? parseFloat(escrow.amount) * FEE_RATE : 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6 flex items-center gap-4">
        <Link href="/history" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-bold text-lg">{escrow?.title ?? 'Transaction'}</h1>
          {escrow && <p className="text-green-300 text-xs">{escrow.code}</p>}
        </div>
      </div>

      {loading && (
        <div className="px-4 py-8 space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
        </div>
      )}

      {error && !loading && (
        <div className="px-4 py-8">
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-5 text-center">
            <p className="font-semibold">{error}</p>
            <Link href="/history" className="mt-3 inline-block text-sm text-[#1B4332] font-semibold">← Back to History</Link>
          </div>
        </div>
      )}

      {escrow && !loading && (
        <div className="px-4 py-5 space-y-4">
          {/* Status tracker */}
          <StatusTracker status={escrow.status} />

          {/* Action buttons */}
          {token && myId && (
            <ActionPanel
              escrow={escrow}
              myId={myId}
              token={token}
              onRefresh={() => load(token)}
            />
          )}

          {/* Amount breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</h3>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Escrow amount</span>
              <span className="text-sm font-semibold text-gray-900">{fmt(escrow.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Service fee (1.5%)</span>
              <span className="text-sm text-gray-500">{fmt(fee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-800">{isBuyer ? 'Total charged' : 'You receive'}</span>
              <span className="text-sm font-bold text-[#1B4332]">
                {isBuyer ? fmt(parseFloat(escrow.amount) + fee) : fmt(escrow.amount)}
              </span>
            </div>
            {escrow.dueDate && (
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Due date</span>
                <span className="text-sm font-semibold text-gray-800">{fmtDate(escrow.dueDate)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Created</span>
              <span className="text-sm text-gray-500">{fmtDate(escrow.createdAt)}</span>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parties</h3>
            {[
              { label: 'Buyer',  party: escrow.buyer,  isMe: isBuyer },
              { label: 'Seller', party: escrow.seller, isMe: !isBuyer },
            ].map(({ label, party, isMe }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  label === 'Buyer' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {party.firstName[0]}{party.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {party.firstName} {party.lastName}
                    {isMe && <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">You</span>}
                  </p>
                  <p className="text-xs text-gray-400">{party.phone}</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {(escrow.description || escrow.buyerNote || escrow.sharedNote) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</h3>
              {escrow.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-800">{escrow.description}</p>
                </div>
              )}
              {escrow.buyerNote && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Buyer note</p>
                  <p className="text-sm text-gray-800">{escrow.buyerNote}</p>
                </div>
              )}
              {escrow.sharedNote && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Shared note</p>
                  <p className="text-sm text-gray-800">{escrow.sharedNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Disputes */}
          {escrow.disputes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide">Dispute</h3>
              {escrow.disputes.map(d => (
                <div key={d.id} className="space-y-1">
                  <p className="text-sm text-red-800 font-medium">{d.reason}</p>
                  <p className="text-xs text-red-400">{fmtDate(d.createdAt)} · {d.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
