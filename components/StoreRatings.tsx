'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type RatingEntry = {
  id: string;
  stars: number;
  comment?: string | null;
  tags?: string[];
  createdAt: string;
  rater: { id: string; firstName: string; lastName: string };
};

type RatingsData = {
  average: number;
  total: number;
  ratings: RatingEntry[];
};

function StarRow({ n }: { n: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`text-sm ${s <= n ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </span>
  );
}

export default function StoreRatings({ userId }: { userId: string }) {
  const [data,    setData]    = useState<RatingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/ratings/user/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="text-sm text-gray-400 py-4">Loading ratings…</div>
  );
  if (!data || data.total === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Transaction Ratings</h2>
          <p className="text-sm text-gray-400 mt-0.5">From verified escrow transactions</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-amber-500">★ {data.average.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.total} rating{data.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.ratings.slice(0, 5).map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#1B4332] flex items-center justify-center text-white font-black text-sm shrink-0">
                {r.rater.firstName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">
                    {r.rater.firstName} {r.rater.lastName}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(r.createdAt).toLocaleDateString('en-GH', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                <StarRow n={r.stars} />
              </div>
            </div>
            {r.tags && r.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                {r.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {r.comment && (
              <p className="text-sm text-gray-700 leading-relaxed mt-1">{r.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
