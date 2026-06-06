'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const FEE_RATE = 0.015;

type Party = { id: string; firstName: string; lastName: string; phone: string; storeName?: string | null; averageRating?: string; totalRatings?: number };
type Dispute = { id: string; reason: string; status: string; createdAt: string };
type Escrow = {
  id: string; code: string; title: string; description?: string;
  amount: string; currency: string; status: string;
  buyerId: string; sellerId: string;
  dueDate?: string; releasedAt?: string; createdAt: string;
  buyerNote?: string; sellerNote?: string; sharedNote?: string;
  buyer: Party; seller: Party;
  deliveryOption?: string;
  disputes: Dispute[];
};

const STATUS_PILL: Record<string, string> = {
  FUNDED:     'bg-green-500/20 text-green-300',
  IN_TRANSIT: 'bg-blue-500/20 text-blue-200',
  COMPLETED:  'bg-green-500/20 text-green-300',
  DISPUTED:   'bg-blue-500/20 text-blue-200',
  PENDING:    'bg-white/20 text-white/70',
  CANCELLED:  'bg-white/10 text-white/50',
};

// Solid pills for use on the gold card (needs contrast against #F5A623)
const STATUS_PILL_CARD: Record<string, string> = {
  FUNDED:     'bg-green-600 text-white',
  IN_TRANSIT: 'bg-blue-600 text-white',
  COMPLETED:  'bg-[#1B4332] text-white',
  DISPUTED:   'bg-blue-700 text-white',
  PENDING:    'bg-[#1B4332]/30 text-[#1B4332]',
  CANCELLED:  'bg-[#1B4332]/20 text-[#1B4332]/60',
};

const STATUS_LABEL: Record<string, string> = {
  FUNDED: 'Funded', IN_TRANSIT: 'In Transit', COMPLETED: 'Completed',
  DISPUTED: 'Disputed', CANCELLED: 'Cancelled', PENDING: 'Pending',
};

function fmt(amount: string | number) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function displayName(p: Party) { return p.storeName?.trim() || `${p.firstName} ${p.lastName}`; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Status tracker ─────────────────────────────────────────────────────────

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
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-blue-700 font-bold text-sm">Dispute Opened</p>
          <p className="text-blue-500 text-xs mt-0.5">Under review by Gyedi support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-100 -z-0" />
        <div
          className="absolute left-5 top-5 h-0.5 bg-[#1B4332] -z-0 transition-all duration-500"
          style={{ width: current === 0 ? '0%' : current === 1 ? '50%' : '100%' }}
        />

        {STEPS.map((step, i) => {
          const done   = i < current;
          const active = i === current;
          const locked = i > current;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                done   ? 'bg-[#1B4332]' :
                active ? 'bg-[#F5A623] ring-4 ring-[#F5A623]/25' :
                         'bg-gray-100'
              }`}>
                {done ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-xs font-bold ${active ? 'text-[#1B4332]' : locked ? 'text-gray-300' : 'text-gray-500'}`}>{i + 1}</span>
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
  const [showDispute, setShowDispute]               = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
const [trackingSaved,  setTrackingSaved]  = useState(false);
  const [disputeReason, setDisputeReason]           = useState('');
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [releaseChecked, setReleaseChecked]         = useState(false);
  const [allowEarlyRelease, setAllowEarlyRelease]   = useState(true);

  useEffect(() => {
    fetch(`${API}/config/public`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.allowEarlyRelease === false) setAllowEarlyRelease(false); })
      .catch(() => {});
  }, []);

  const isBuyer  = myId === escrow.buyerId;
  const isSeller = myId === escrow.sellerId;
  const { status } = escrow;

  async function action(path: string, method = 'PATCH', body: object = {}) {
    setLoading(path);
    setError('');
    try {
      const res  = await fetch(`${API}/escrows/${escrow.id}/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Action failed');
      onRefresh();
    } catch {
      setError('Something went wrong, please try again.');
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
      <div className="space-y-3">
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
        <Link
          href={`/escrow/${escrow.id}/receipt`}
          className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-[#1B4332] font-bold py-3 rounded-2xl text-sm transition-colors hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Receipt
        </Link>
        <Link
          href="/marketplace"
          className="block w-full text-center bg-[#1B4332] text-white font-bold py-3 rounded-2xl text-sm transition-colors hover:bg-[#0F2B1F]"
        >
          Continue Shopping →
        </Link>
      </div>
    );
  }

  if (status === 'DISPUTED' || status === 'CANCELLED') return null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Buyer: fund PENDING escrow */}
      {isBuyer && status === 'PENDING' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-800 font-bold text-sm">Payment Required</p>
              <p className="text-amber-600 text-xs mt-0.5">This escrow is awaiting your payment. Fund it to proceed.</p>
            </div>
          </div>
          <a
            href={`/escrow/${escrow.id}/pay`}
            className={`${btnBase} bg-[#F5A623] text-[#1B4332] shadow-sm flex items-center justify-center gap-2`}
          >
            💳 Pay to Fund Escrow
          </a>
        </div>
      )}

      {!isBuyer && status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-amber-700 font-semibold text-sm">Awaiting buyer payment</p>
          <p className="text-amber-500 text-xs mt-1">Funds will appear here once the buyer completes payment.</p>
        </div>
      )}

      {/* Seller: mark shipped */}
      {isSeller && status === 'FUNDED' && (
        <button
          onClick={() => action('ship', 'PATCH', {})}
          disabled={!!loading}
          className={`${btnBase} bg-[#F5A623] text-[#1B4332] shadow-sm`}
        >
          {loading === 'ship' ? 'Updating…' : '📦 Mark as Shipped'}
        </button>
      )}

      {isSeller && status === 'IN_TRANSIT' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-blue-700 text-sm font-semibold">Waiting for buyer to confirm receipt</p>
            <p className="text-blue-500 text-xs mt-1">Funds will be released once confirmed</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Add Tracking Number</p>
            <div className="flex gap-2">
              <input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. DHL123456789"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              <button
                onClick={async () => {
                  if (!trackingNumber.trim()) return;
                  await action('tracking', 'PATCH', { trackingNumber: trackingNumber.trim() });
                  setTrackingSaved(true);
                  setTimeout(() => setTrackingSaved(false), 3000);
                }}
                disabled={!!loading || !trackingNumber.trim()}
                className="px-4 py-2.5 bg-[#1B4332] text-white text-sm font-bold rounded-xl disabled:opacity-50"
              >
                Save
              </button>
            </div>
            {trackingSaved && <p className="text-xs text-green-600">✔ Tracking number saved!</p>}
          </div>
        </div>
      )}

      {isSeller && status === 'FUNDED' && (
        <p className="text-center text-xs text-gray-400">Ship the item and mark it above once dispatched</p>
      )}

      {/* Buyer: release early */}
      {isBuyer && status === 'FUNDED' && allowEarlyRelease && !showReleaseConfirm && (
        <button
          onClick={() => setShowReleaseConfirm(true)}
          disabled={!!loading}
          className={`${btnBase} bg-[#1B4332] text-white`}
        >
          Release to Seller Early
        </button>
      )}

      {isBuyer && status === 'FUNDED' && allowEarlyRelease && showReleaseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => { setShowReleaseConfirm(false); setReleaseChecked(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-3xl">⚠️</div>
              <h2 className="text-lg font-bold text-gray-900">Release Early?</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Only release early if you have already received your item or fully trust this seller.
                Once released, this cannot be undone and no refund can be requested.
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={releaseChecked}
                onChange={e => setReleaseChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#1B4332] cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-gray-700 font-medium">I understand this cannot be undone</span>
            </label>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowReleaseConfirm(false); setReleaseChecked(false); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 border-[#1B4332] text-[#1B4332] bg-white hover:bg-green-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowReleaseConfirm(false); setReleaseChecked(false); action('release', 'PATCH', {}); }}
                disabled={!releaseChecked || !!loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading === 'release' ? 'Releasing…' : 'Release Early'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buyer: confirm receipt */}
      {isBuyer && status === 'IN_TRANSIT' && (
        <>
          <button
            onClick={() => action('confirm-receipt')}
            disabled={!!loading}
            className={`${btnBase} bg-[#F5A623] text-[#1B4332] shadow-sm`}
          >
            {loading === 'confirm-receipt' ? 'Confirming…' : '✅ Confirm Receipt & Release Funds'}
          </button>

          {!showDispute ? (
            <button
              onClick={() => setShowDispute(true)}
              className={`${btnBase} bg-white border border-gray-200 text-blue-500`}
            >
              Open Dispute
            </button>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <p className="text-blue-700 font-semibold text-sm">Describe the issue</p>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="What went wrong? Please provide details (min 10 characters)…"
                rows={3}
                className="w-full text-sm bg-white border border-blue-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-500 disabled:opacity-50"
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

  const isBuyer = escrow ? myId === escrow.buyerId : false;
  const fee     = escrow ? parseFloat(escrow.amount) * FEE_RATE : 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-6 md:py-10">
      <div className="max-w-[800px] mx-auto md:px-4">
      {/* Breadcrumb */}
      <div className="bg-[#1B4332] md:rounded-2xl px-5 pt-12 md:pt-6 pb-1">
        <div className="flex items-center gap-1.5 text-white/50 text-xs">
          <Link href="/dashboard" className="hover:text-white/80 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/history" className="hover:text-white/80 transition-colors">Transactions</Link>
          <span>/</span>
          <span className="text-white/70 truncate max-w-[120px]">{escrow?.code ?? '…'}</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-3 pb-6 flex items-center gap-4">
        <Link href="/history" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg truncate">{escrow?.title ?? 'Transaction'}</h1>
          {escrow && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[#F5A623] font-black text-sm tracking-widest">{escrow.code}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_PILL[escrow.status] ?? 'bg-white/20 text-white/70'}`}>
                {STATUS_LABEL[escrow.status] ?? escrow.status}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          {escrow && (
            <Link
              href={`/escrow/${escrow.id}/chat`}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a1 1 0 00-1 1v14a1 1 0 001 1h3v3l4-3h11a1 1 0 001-1V4a1 1 0 00-1-1z" />
              </svg>
            </Link>
          )}
          <Link href="/profile" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Gold amount hero */}
      {escrow && !loading && (
        <div className="bg-[#1B4332] px-5 pb-6">
          <div className="bg-[#F5A623] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[#1B4332]/70 text-[10px] font-bold uppercase tracking-widest">Escrow Amount</p>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_PILL_CARD[escrow.status] ?? 'bg-[#1B4332]/20 text-[#1B4332]'}`}>
                {STATUS_LABEL[escrow.status] ?? escrow.status}
              </span>
            </div>
            <p className="text-[#1B4332] font-black text-4xl">{fmt(escrow.amount)}</p>
            <p className="text-[#1B4332]/60 text-xs mt-1">
              {isBuyer ? `You pay GHS ${(parseFloat(escrow.amount) + fee).toLocaleString('en-GH', { minimumFractionDigits: 2 })} incl. 1.5% fee` : `You receive ${fmt(escrow.amount)}`}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1B4332]/10">
              <p className="text-[#1B4332]/80 text-xs font-semibold">
                {isBuyer
                  ? `To: ${displayName(escrow.seller)}`
                  : `From: ${displayName(escrow.buyer)}`}
              </p>
              <p className="text-[#1B4332]/60 text-xs">{fmtDate(escrow.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="px-4 py-8 space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
        </div>
      )}

      {error && !loading && (
        <div className="px-4 py-8">
          <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl p-5 text-center">
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fee Breakdown</h3>
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
                  label === 'Buyer' ? 'bg-blue-100 text-blue-700' : 'bg-[#F5A623]/20 text-[#92400E]'
                }`}>
                  {displayName(party)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {displayName(party)}
                    {isMe && <span className="ml-1.5 text-xs bg-[#F5A623]/20 text-[#92400E] px-1.5 py-0.5 rounded-full font-bold">You</span>}
                  </p>
                  <p className="text-xs text-gray-400">{party.phone}</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{label}</span>
              </div>
            ))}
          </div>

          {/* Details */}
          {(escrow.description || escrow.buyerNote || escrow.sharedNote || escrow.deliveryOption) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</h3>
              {escrow.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-800">{escrow.description}</p>
                </div>
              )}

               {escrow.deliveryOption && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Delivery Method</p>
                  <p className="text-sm text-gray-800 flex items-center gap-2">
                    <span>{({'personal':'🚶','pickup':'🏪','courier':'📦','bus':'🚌','glovo':'🛵'} as any)[escrow.deliveryOption] ?? '📦'}</span>
                    <span className="font-semibold capitalize">{escrow.deliveryOption}</span>
                  </p>
                </div>
              )}
              
              {(escrow as any).trackingNumber && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Tracking Number</p>
                  <p className="text-sm font-bold text-[#1B4332]">{(escrow as any).trackingNumber}</p>
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
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Dispute</h3>
              {escrow.disputes.map(d => (
                <div key={d.id} className="space-y-1">
                  <p className="text-sm text-blue-800 font-medium">{d.reason}</p>
                  <p className="text-xs text-blue-400">{fmtDate(d.createdAt)} · {d.status}</p>
                </div>
              ))}
            </div>
          )}
          {/* Browse Marketplace */}
          <Link
            href="/marketplace"
            className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1B4332]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Browse Marketplace</p>
                <p className="text-xs text-gray-400">Find more escrow-protected listings</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-[#1B4332] transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      </div>
    </div>
  );
}
