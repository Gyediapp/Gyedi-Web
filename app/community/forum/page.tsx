'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#1B4332] to-[#0F2B1F] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <Link href="/community" className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Community
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white">Community Forum</h1>
          <p className="text-green-300/70 text-sm mt-1">Ask questions, share tips, connect with traders</p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-36 bg-[#1E293B] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/community/forum/${cat.slug}`}
                className="group relative bg-[#1E293B] border border-white/5 rounded-2xl p-5 hover:border-[#F5A623]/40 hover:bg-[#1E293B]/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#F5A623]/5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{cat.icon ?? '💬'}</span>
                  <span className="text-[10px] font-bold text-[#F5A623]/70 bg-[#F5A623]/10 px-2 py-0.5 rounded-full">
                    {Number(cat.postCount)} posts
                  </span>
                </div>
                <h3 className="font-black text-white text-sm leading-snug group-hover:text-[#F5A623] transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-xs text-white/40 mt-1.5 line-clamp-2 leading-relaxed">{cat.description}</p>
                )}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-white/50 font-semibold">Forum is being set up</p>
            <p className="text-white/30 text-sm mt-1">Categories will appear shortly</p>
          </div>
        )}
      </div>
    </div>
  );
}
