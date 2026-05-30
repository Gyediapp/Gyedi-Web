'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Post = {
  id: string; title: string; body: string; upvotes: number; downvotes: number;
  isPinned: boolean; isLocked: boolean; viewCount: number;
  createdAt: string; categoryName: string; categorySlug: string;
  firstName: string; lastName: string; replyCount: number | string;
};

type CreatePostState = { title: string; body: string; categoryId: string };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
}

function initials(first: string, last: string) {
  return `${(first[0] ?? '').toUpperCase()}${(last[0] ?? '').toUpperCase()}`;
}

const AVATAR_COLORS = ['#F5A623', '#1B4332', '#7C3AED', '#0369A1', '#B45309', '#15803D'];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CategoryPage() {
  const params       = useParams();
  const categorySlug = params?.categorySlug as string;

  const [posts,        setPosts]        = useState<Post[]>([]);
  const [categoryId,   setCategoryId]   = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [form,         setForm]         = useState<CreatePostState>({ title: '', body: '', categoryId: '' });
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!categorySlug) return;
    fetch(`${API}/forum/`)
      .then(r => r.ok ? r.json() : { categories: [] })
      .then(d => {
        const cat = (d.categories ?? []).find((c: { slug: string; id: string; name: string }) => c.slug === categorySlug);
        if (cat) {
          setCategoryId(cat.id);
          setCategoryName(cat.name);
          setForm(f => ({ ...f, categoryId: cat.id }));
        }
      })
      .catch(() => {});

    fetch(`${API}/forum/posts?categorySlug=${encodeURIComponent(categorySlug)}&limit=50`)
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(d => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/forum/posts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ categoryId, title: form.title.trim(), body: form.body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create post');
      setShowModal(false);
      setForm(f => ({ ...f, title: '', body: '' }));
      if (data.post?.id) window.location.href = `/community/forum/post/${data.post.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#1B4332] to-[#0F2B1F] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <Link href="/community/forum" className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Forum
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{categoryName || categorySlug}</h1>
              <p className="text-green-300/70 text-sm mt-1">{posts.length} discussions</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex-shrink-0 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* Thread list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-24 bg-[#1E293B] rounded-2xl animate-pulse" />)
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-white/50 font-semibold text-lg">No discussions yet</p>
            <p className="text-white/30 text-sm mt-1">Be the first to start a conversation</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Start Discussion
            </button>
          </div>
        ) : (
          posts.map(post => {
            const color = avatarColor(`${post.firstName}${post.lastName}`);
            return (
              <Link
                key={post.id}
                href={`/community/forum/post/${post.id}`}
                className="group flex items-start gap-4 bg-[#1E293B] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-[#F5A623]/30 hover:bg-[#1E293B]/80 transition-all duration-200"
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: color }}
                >
                  {initials(post.firstName, post.lastName)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.isPinned && (
                      <span className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full">📌 Pinned</span>
                    )}
                    {post.isLocked && (
                      <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">🔒 Locked</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2 break-words group-hover:text-[#F5A623] transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-white/40">{post.firstName} {post.lastName}</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-xs text-white/40">{timeAgo(post.createdAt)}</span>
                    <span className="text-white/20 text-xs hidden sm:inline">·</span>
                    <span className="hidden sm:inline text-xs text-white/40">👍 {Number(post.upvotes)}</span>
                    <span className="hidden sm:inline text-xs text-white/40">💬 {Number(post.replyCount)}</span>
                    <span className="hidden sm:inline text-xs text-white/40">👁 {Number(post.viewCount)}</span>
                  </div>
                </div>

                <svg className="w-4 h-4 text-white/20 group-hover:text-[#F5A623] transition-colors flex-shrink-0 mt-1.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })
        )}
      </div>

      {/* New Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl sm:rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-white text-lg">New Discussion</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors text-xl">✕</button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-1.5 font-semibold">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  placeholder="What do you want to discuss?"
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1.5 font-semibold">Body * ({form.body.length}/10000)</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 10000) }))}
                  rows={6}
                  placeholder="Share your thoughts…"
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black py-3 rounded-xl text-sm transition-colors"
              >
                {submitting ? 'Posting…' : 'Post Discussion'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
