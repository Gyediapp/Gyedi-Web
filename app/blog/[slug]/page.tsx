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
  likeCount: number;
  firstName: string | null; lastName: string | null;
};

type Comment = {
  id: string; body: string; createdAt: string;
  firstName: string; lastName: string;
};

function fmt(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
}

function readTime(body: string) {
  const words = (body ?? '').trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

const AVATAR_COLORS = ['#F5A623', '#1B4332', '#7C3AED', '#0369A1', '#B45309', '#15803D'];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function BlogPostPage() {
  const params   = useParams();
  const slug     = params?.slug as string;

  const [post,         setPost]         = useState<BlogPost | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [shareUrl,     setShareUrl]     = useState('');

  // Likes
  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(0);
  const [liking,       setLiking]       = useState(false);

  // Comments
  const [comments,     setComments]     = useState<Comment[]>([]);
  const [commentBody,  setCommentBody]  = useState('');
  const [posting,      setPosting]      = useState(false);
  const [commentErr,   setCommentErr]   = useState('');
  const [commentOk,    setCommentOk]    = useState('');
  const [isLoggedIn,   setIsLoggedIn]   = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
      setIsLoggedIn(!!localStorage.getItem('gyedi_token'));
    }
    if (!slug) return;

    fetch(`${API}/blog/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.post) {
          setPost(d.post);
          setLikeCount(Number(d.post.likeCount ?? 0));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API}/blog/${encodeURIComponent(slug)}/comments`)
      .then(r => r.ok ? r.json() : { comments: [] })
      .then(d => setComments(d.comments ?? []))
      .catch(() => {});
  }, [slug]);

  async function handleLike() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`${API}/blog/${encodeURIComponent(slug)}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch {}
    setLiking(false);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (!commentBody.trim()) { setCommentErr('Comment cannot be empty'); return; }
    setPosting(true);
    setCommentErr('');
    setCommentOk('');
    try {
      const res = await fetch(`${API}/blog/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post comment');
      setComments(prev => [...prev, data.comment]);
      setCommentBody('');
      setCommentOk('Comment posted!');
      setTimeout(() => setCommentOk(''), 3000);
    } catch (err) {
      setCommentErr(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  }

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
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Blog
              </Link>
            </div>
          </div>
        )}

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
            <div className="text-4xl mb-3">📄</div>
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

            {/* Like + Share */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50 min-h-[44px] ${
                  liked
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}
              </button>
              <span className="text-white/20 text-sm">·</span>
              <span className="text-white/30 text-sm">💬 {comments.length} comments</span>
              {shareUrl && (
                <div className="ml-auto">
                  <ShareButtons url={shareUrl} title={post.title} compact />
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <h2 className="font-black text-white/80 text-sm">
                {comments.length > 0 ? `${comments.length} Comment${comments.length === 1 ? '' : 's'}` : 'Comments'}
              </h2>

              {/* Comment list */}
              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] flex-shrink-0 text-white"
                          style={{ backgroundColor: avatarColor(`${comment.firstName}${comment.lastName}`) }}
                        >
                          {(comment.firstName[0] ?? '').toUpperCase()}{(comment.lastName[0] ?? '').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white/80">{comment.firstName} {comment.lastName}</p>
                          <p className="text-xs text-white/30">{timeAgo(comment.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment form */}
              {isLoggedIn ? (
                <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
                  <h3 className="font-black text-white/80 text-sm mb-3">Leave a Comment</h3>
                  <form onSubmit={handleComment} className="space-y-3">
                    <textarea
                      value={commentBody}
                      onChange={e => setCommentBody(e.target.value.slice(0, 2000))}
                      rows={3}
                      placeholder="Share your thoughts..."
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors resize-none"
                    />
                    {commentErr && <p className="text-xs text-red-400">{commentErr}</p>}
                    {commentOk  && <p className="text-xs text-green-400">✔ {commentOk}</p>}
                    <button
                      type="submit"
                      disabled={posting}
                      className="bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {posting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-sm text-white/40 mb-3">Log in to leave a comment</p>
                  <Link
                    href="/login"
                    className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-6 py-2.5 rounded-xl text-sm transition-colors inline-block"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>

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
