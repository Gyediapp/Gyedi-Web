'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Category = {
  id: string; name: string; slug: string; description: string | null;
  icon: string | null; color: string; postCount: number;
};

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch(`${API}/forum/`)
      .then(r => r.ok ? r.json() : { categories: [] })
      .then(d => setCategories(d.categories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <a href="/community" className="text-green-300 text-sm hover:text-white">← Community</a>
        </div>
        <h1 className="text-white font-black text-xl">Forum</h1>
        <p className="text-green-300 text-sm mt-0.5">Join the discussion</p>
      </div>

      <div className="px-4 py-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <a
                key={cat.id}
                href={`/community/forum/${cat.slug}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-3xl mb-2">{cat.icon ?? '💬'}</div>
                <p className="text-sm font-black text-gray-900">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cat.description}</p>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-semibold text-[#1B4332] bg-[#1B4332]/5 px-2 py-0.5 rounded-full">
                    {cat.postCount} posts
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
