'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Post = {
  id: string; title: string; body: string; upvotes: number; downvotes: number;
  isPinned: boolean; isLocked: boolean; viewCount: number;
  createdAt: string; categoryName: string; categorySlug: string;
  firstName: string; lastName: string; replyCount: number | string;
};

type CreatePostState = { title: string; body: string; categoryId: string };

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

    // Fetch categories to get the categoryId
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
      // Navigate to the new post
      if (data.post?.id) window.location.href = `/community/forum/post/${data.post.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <a href="/community/forum" className="text-green-300 text-sm hover:text-white">← Forum</a>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-xl">{categoryName || categorySlug}</h1>
            <p className="text-green-300 text-sm mt-0.5">{posts.length} discussions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#F5A623] text-[#1B4332] font-black text-sm px-4 py-2 rounded-xl hover:bg-[#D4881A] transition-colors"
          >
            + New Post
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-500 font-semibold">No discussions yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to start a conversation!</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-[#1B4332] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#0F2B1F] transition-colors"
            >
              Start Discussion
            </button>
          </div>
        ) : (
          posts.map(post => (
            <a
              key={post.id}
              href={`/community/forum/post/${post.id}`}
              className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {post.isPinned && (
                    <span className="text-xs bg-[#F5A623]/15 text-[#D4881A] font-bold px-2 py-0.5 rounded-full">📌 Pinned</span>
                  )}
                  {post.isLocked && (
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">🔒 Locked</span>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{post.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-gray-400">{post.firstName} {post.lastName}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">👍 {Number(post.upvotes)}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">💬 {Number(post.replyCount)}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">👁 {Number(post.viewCount)}</span>
                </div>
              </div>
              <span className="text-gray-300 text-lg flex-shrink-0">›</span>
            </a>
          ))
        )}
      </div>

      {/* New Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-t-3xl w-full p-5 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900">New Discussion</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  placeholder="What do you want to discuss?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Body ({form.body.length}/10000)</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 10000) }))}
                  rows={6}
                  placeholder="Share your thoughts..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post Discussion'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
