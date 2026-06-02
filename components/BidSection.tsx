'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Bid = {
  id: string;
  amount: number;
  bidderName: string;
  createdAt: string;
};

function Countdown({ endTime }: { endTime: string }) {
  const [diff, setDiff] = useState(() => Math.max(0, new Date(endTime).getTime() - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      setDiff(Math.max(0, new Date(endTime).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (diff === 0) return <span className="text-red-500 font-black">Auction Ended</span>;

  return (
    <div className="flex items-center gap-2">
      {days > 0 && (
        <div className="text-center">
          <div className="text-2xl font-black text-[#1B4332]">{days}</div>
          <div className="text-[10px] text-gray-400 uppercase">Days</div>
        </div>
      )}
      <div className="text-center">
        <div className="text-2xl font-black text-[#1B4332]">{pad(hours)}</div>
        <div className="text-[10px] text-gray-400 uppercase">Hrs</div>
      </div>
      <div className="text-[#1B4332] font-black text-xl">:</div>
      <div className="text-center">
        <div className="text-2xl font-black text-[#1B4332]">{pad(minutes)}</div>
        <div className="text-[10px] text-gray-400 uppercase">Min</div>
      </div>
      <div className="text-[#1B4332] font-black text-xl">:</div>
      <div className="text-center">
        <div className="text-2xl font-black text-[#1B4332]">{pad(seconds)}</div>
        <div className="text-[10px] text-gray-400 uppercase">Sec</div>
      </div>
    </div>
  );
}

export default function BidSection({
  listingId,
  sellerId,
  currentBid,
  startingPrice,
  bidCount,
  auctionEndTime,
  reservePrice,
}: {
  listingId: string;
  sellerId: string;
  currentBid: number | null;
  startingPrice: number;
  bidCount: number;
  auctionEndTime: string | null;
  reservePrice: number | null;
}) {
  const [bids,       setBids]       = useState<Bid[]>([]);
  const [bidAmount,  setBidAmount]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [showBids,   setShowBids]   = useState(false);
  const [myId,       setMyId]       = useState<string | null>(null);
  const [currentHighest, setCurrentHighest] = useState(currentBid);
  const [totalBids, setTotalBids] = useState(bidCount);

  const isEnded = auctionEndTime ? new Date(auctionEndTime).getTime() < Date.now() : false;
  const isSeller = myId === sellerId;
  const minBid = (currentHighest ?? startingPrice) + 1;

  useEffect(() => {
    try {
      const token = localStorage.getItem('gyedi_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        setMyId(payload.sub ?? null);
      }
    } catch {}
  }, []);

  async function loadBids() {
    try {
      const res = await fetch(`${API}/listings/${listingId}/bids`);
      const data = await res.json();
      if (data.bids) setBids(data.bids);
    } catch {}
  }

  async function placeBid() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    const amount = parseFloat(bidAmount);
    if (!amount || amount < minBid) {
      setError(`Minimum bid is GHS ${minBid.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API}/listings/${listingId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to place bid');
      setCurrentHighest(amount);
      setTotalBids(prev => prev + 1);
      setBidAmount('');
      setSuccess(`Bid of GHS ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })} placed successfully!`);
      setTimeout(() => setSuccess(''), 4000);
      if (showBids) loadBids();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border-2 border-[#F5A623] rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔨</span>
          <h3 className="font-black text-gray-900 text-base">Live Auction</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isEnded ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700 animate-pulse'
          }`}>
            {isEnded ? 'Ended' : 'Live'}
          </span>
        </div>
        <span className="text-xs text-gray-400">{totalBids} bid{totalBids !== 1 ? 's' : ''}</span>
      </div>

      {/* Current bid */}
      <div className="bg-[#F4F6F8] rounded-xl p-4">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
          {currentHighest ? 'Current Highest Bid' : 'Starting Price'}
        </p>
        <p className="text-3xl font-black text-[#1B4332]">
          GHS {(currentHighest ?? startingPrice).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
        </p>
        {reservePrice && !currentHighest && (
          <p className="text-xs text-amber-600 mt-1">Reserve price not yet met</p>
        )}
      </div>

      {/* Countdown */}
      {auctionEndTime && (
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
            {isEnded ? 'Auction ended' : 'Time remaining'}
          </p>
          <Countdown endTime={auctionEndTime} />
        </div>
      )}

      {/* Bid form */}
      {!isEnded && !isSeller && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">GHS</span>
              <input
                type="number"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder={minBid.toFixed(2)}
                min={minBid}
                step="0.01"
                className="w-full pl-12 pr-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>
            <button
              onClick={placeBid}
              disabled={submitting}
              className="bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black px-6 py-3 rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Bidding...' : 'Place Bid'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Minimum bid: GHS {minBid.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          {error   && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">✔ {success}</p>}
        </div>
      )}

      {isEnded && (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-gray-600">This auction has ended</p>
          {currentHighest && (
            <p className="text-xs text-gray-400 mt-1">
              Final price: GHS {currentHighest.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      )}

      {/* Bid history toggle */}
      <button
        onClick={() => { setShowBids(v => !v); if (!showBids) loadBids(); }}
        className="w-full text-xs text-[#1B4332] font-semibold hover:underline"
      >
        {showBids ? 'Hide bid history' : 'View bid history'}
      </button>

      {showBids && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {bids.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No bids yet — be the first!</p>
          ) : (
            bids.map((bid, i) => (
              <div key={bid.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  {i === 0 && <span className="text-xs bg-[#F5A623] text-[#1B4332] font-black px-1.5 py-0.5 rounded-full">TOP</span>}
                  <span className="text-xs text-gray-600 font-medium">{bid.bidderName}</span>
                </div>
                <span className="text-xs font-black text-[#1B4332]">
                  GHS {Number(bid.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
