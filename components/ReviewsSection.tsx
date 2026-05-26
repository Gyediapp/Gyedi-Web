'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api.up.railway.app';

type Review = {
  id: string;
  stars: number;
  body: string | null;
  sellerReply: string | null;
  createdAt: string;
  reviewer: { id: string; firstName: string; lastName: string };
};

type Breakdown = { stars: number; count: number };

function Stars({ n, size = 'sm' }: { n: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <span className={sz}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= n ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsSection({ sellerId, sellerName }: { sellerId: string; sellerName: string }) {
  const [reviews,   setReviews]   = useState<Review[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [stars,     setStars]     = useState(5);
  const [body,      setBody]      = useState('');
  const [posting,   setPosting]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    fetch(`${API}/api/social/reviews/${sellerId}`)
      .then(r => r.json())
      .then(d => {
        setReviews(d.reviews ?? []);
        setBreakdown(d.breakdown ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  const total  = reviews.length;
  const avg    = total > 0 ? reviews.reduce((s, r) => s + r.stars, 0) / total : 0;

  async function submitReview() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { setError('Please sign in to leave a review.'); return; }
    setPosting(true); setError('');
    try {
      const res = await fetch(`${API}/api/social/reviews/${sellerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stars, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => [data, ...prev]);
        setBreakdown(prev => prev.map(b => b.stars === stars ? { ...b, count: b.count + 1 } : b));
        setShowForm(false); setBody(''); setStars(5);
      } else setError(data.error ?? 'Failed to post review');
    } catch { setError('Network error'); }
    setPosting(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-900">
          Community Reviews
          {total > 0 && <span className="text-gray-400 font-normal text-base ml-2">({total})</span>}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-semibold text-[#1B4332] hover:underline"
          >
            + Write a Review
          </button>
        )}
      </div>

      {/* Aggregate stats */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 flex flex-col sm:flex-row gap-6">
          <div className="text-center shrink-0">
            <p className="text-5xl font-black text-gray-900">{avg.toFixed(1)}</p>
            <Stars n={Math.round(avg)} size="lg" />
            <p className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(s => {
              const c = breakdown.find(b => b.stars === s)?.count ?? 0;
              const pct = total > 0 ? (c / total) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4 text-right shrink-0">{s}</span>
                  <span className="text-amber-400 text-xs shrink-0">★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-4 shrink-0">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Rate {sellerName}</h3>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setStars(s)} className="text-2xl transition-transform hover:scale-110">
                <span className={s <= stars ? 'text-amber-400' : 'text-gray-200'}>★</span>
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your experience with this seller (optional)…"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none mb-3"
          />
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={submitReview}
              disabled={posting}
              className="bg-[#1B4332] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0F2B1F] disabled:opacity-50 transition-colors"
            >
              {posting ? 'Posting…' : 'Submit Review'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="text-sm text-gray-500 px-3 py-2.5 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-sm text-gray-400">Loading reviews…</div>
      ) : reviews.length === 0 && !showForm ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <p className="text-2xl mb-2">🌟</p>
          <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#1B4332] flex items-center justify-center text-white font-black text-sm shrink-0">
                  {r.reviewer.firstName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">{r.reviewer.firstName} {r.reviewer.lastName}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <Stars n={r.stars} />
                </div>
              </div>
              {r.body && <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>}
              {r.sellerReply && (
                <div className="mt-3 ml-4 bg-gray-50 rounded-xl px-4 py-3 border-l-2 border-[#1B4332]">
                  <p className="text-xs font-bold text-[#1B4332] mb-1">Seller response</p>
                  <p className="text-sm text-gray-700">{r.sellerReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
