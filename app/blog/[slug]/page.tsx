'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string | null;
  body: string; coverImage: string | null;
  publishedAt: string | null; tags: string[]; viewCount: number;
  firstName: string | null; lastName: string | null;
};

export default function BlogPostPage() {
  const params   = useParams();
  const slug     = params?.slug as string;
  const [post,    setPost]    = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/blog/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.post) setPost(d.post); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  function fmt(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6">
        <a href="/blog" className="text-green-300 text-sm hover:text-white block mb-2">← Blog</a>
        {post && (
          <>
            <h1 className="text-white font-black text-xl leading-snug">{post.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {post.firstName && (
                <span className="text-green-300 text-xs">by {post.firstName} {post.lastName}</span>
              )}
              {post.publishedAt && (
                <>
                  <span className="text-green-600 text-xs">·</span>
                  <span className="text-green-300 text-xs">{fmt(post.publishedAt)}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="px-4 py-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-48 bg-white rounded-2xl animate-pulse" />
            <div className="h-40 bg-white rounded-2xl animate-pulse" />
          </div>
        ) : !post ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 font-semibold">Post not found</p>
            <a href="/blog" className="text-[#1B4332] text-sm font-bold hover:underline mt-2 block">← Back to Blog</a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cover image */}
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverImage} alt={post.title} className="w-full h-48 object-cover rounded-2xl" />
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-[#1B4332]/5 text-[#1B4332] font-semibold px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div className="bg-[#F5A623]/10 border-l-4 border-[#F5A623] rounded-r-xl px-4 py-3">
                <p className="text-sm text-gray-700 font-semibold italic">{post.excerpt}</p>
              </div>
            )}

            {/* Body */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="space-y-4">
                {post.body.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>👁 {Number(post.viewCount)} views</span>
              <a href="/blog" className="text-[#1B4332] font-bold hover:underline">← More articles</a>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
