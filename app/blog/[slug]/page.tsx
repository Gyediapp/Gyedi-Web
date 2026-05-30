'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ShareButtons from '@/components/ShareButtons';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string | null;
  body: string; coverImage: string | null;
  publishedAt: string | null; tags: string[]; viewCount: number;
  firstName: string | null; lastName: string | null;
};

function fmt(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readTime(body: string) {
  const words = (body ?? '').trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export default function BlogPostPage() {
  const params   = useParams();
  const slug     = params?.slug as string;
  const [post,    setPost]    = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setShareUrl(window.location.href);
    if (!slug) return;
    fetch(`${API}/blog/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.post) setPost(d.post); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header / Cover */}
      <div className="relative">
        {post?.coverImage ? (
          <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/60 to-transparent" />
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-[#1B4332] to-[#0F2B1F] overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 space-y-1">
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Blog
              </Link>
            </div>
          </div>
        )}

        {/* Meta overlay (only if cover image) */}
        {post?.coverImage && (
          <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-white/60 text-sm hover:text-white transition-colors mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Blog
            </Link>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 bg-[#1E293B] rounded-xl animate-pulse w-3/4" />
            <div className="h-4 bg-[#1E293B] rounded-xl animate-pulse" />
            <div className="h-60 bg-[#1E293B] rounded-2xl animate-pulse" />
          </div>
        ) : !post ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-white/50 font-semibold">Post not found</p>
            <Link href="/blog" className="text-[#F5A623] text-sm hover:underline mt-2 block">← Back to Blog</Link>
          </div>
        ) : (
          <>
            {/* Title + meta */}
            <div>
              {(post.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(post.tags ?? []).slice(0, 4).map((tag: string) => (
                    <span key={tag} className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/10 px-2.5 py-1 rounded-full uppercase tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-snug">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-white/40">
                {post.firstName && (
                  <span className="font-medium text-white/60">by {post.firstName} {post.lastName}</span>
                )}
                {post.publishedAt && (
                  <>
                    <span>·</span>
                    <span>{fmt(post.publishedAt)}</span>
                  </>
                )}
                <span>·</span>
                <span>{readTime(post.body)}</span>
                <span>·</span>
                <span>👁 {Number(post.viewCount)}</span>
              </div>
            </div>

            {/* Excerpt callout */}
            {post.excerpt && (
              <div className="border-l-4 border-[#F5A623] pl-4 py-1">
                <p className="text-base text-white/70 font-medium italic leading-relaxed">{post.excerpt}</p>
              </div>
            )}

            {/* Body */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 sm:p-8">
              <div className="prose-sm sm:prose max-w-none">
                {post.body.split('\n\n').map((para, i) => {
                  const isBold = para.startsWith('**') && para.includes('**');
                  if (isBold) {
                    return (
                      <h3 key={i} className="text-base sm:text-lg font-black text-white mt-5 mb-2 first:mt-0">
                        {para.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  return (
                    <p key={i} className="text-sm sm:text-base text-white/70 leading-relaxed mb-4 last:mb-0">
                      {para}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Share */}
            {shareUrl && (
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4">
                <ShareButtons url={shareUrl} title={post.title} />
              </div>
            )}

            {/* Back */}
            <div className="flex items-center justify-between pt-2">
              <Link href="/blog" className="text-[#F5A623] text-sm font-bold hover:underline flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                More articles
              </Link>
              <Link href="/community/forum" className="text-white/40 text-sm hover:text-white transition-colors">
                Join the discussion →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
