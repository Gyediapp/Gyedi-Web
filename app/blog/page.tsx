'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string | null;
  coverImage: string | null; publishedAt: string | null;
  tags: string[]; viewCount: number;
};

export default function BlogPage() {
  const [posts,   setPosts]   = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/blog?limit=50`)
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(d => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function fmt(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <a href="/community" className="text-green-300 text-sm hover:text-white">← Community</a>
        </div>
        <h1 className="text-white font-black text-xl">Gyedi Blog</h1>
        <p className="text-green-300 text-sm mt-0.5">Tips, guides & news</p>
      </div>

      <div className="px-4 py-5">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-gray-500 font-semibold">No posts yet</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon for articles and guides</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:bg-gray-50 transition-colors"
              >
                {post.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImage} alt={post.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {post.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs bg-[#1B4332]/5 text-[#1B4332] font-semibold px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="font-black text-gray-900 text-base leading-snug">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    {post.publishedAt && (
                      <span className="text-xs text-gray-400">{fmt(post.publishedAt)}</span>
                    )}
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">👁 {Number(post.viewCount)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
