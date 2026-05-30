'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string | null;
  coverImage: string | null; publishedAt: string | null;
  tags: string[]; viewCount: number;
};

function readTime(text: string) {
  const words = (text ?? '').trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function fmt(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

type SubmitForm = { title: string; excerpt: string; body: string; tags: string };

const EMPTY_FORM: SubmitForm = { title: '', excerpt: '', body: '', tags: '' };

export default function BlogPage() {
  const [posts,       setPosts]       = useState<BlogPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState<SubmitForm>(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitMsg,   setSubmitMsg]   = useState('');
  const [submitErr,   setSubmitErr]   = useState('');

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('gyedi_token'));
    fetch(`${API}/blog?limit=50`)
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(d => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (!form.title.trim() || !form.body.trim()) { setSubmitErr('Title and body are required'); return; }
    setSubmitting(true);
    setSubmitErr('');
    setSubmitMsg('');
    try {
      const res = await fetch(`${API}/blog/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          title:   form.title.trim(),
          excerpt: form.excerpt.trim() || undefined,
          body:    form.body.trim(),
          tags:    form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      setSubmitMsg(data.message ?? 'Submitted for review!');
      setForm(EMPTY_FORM);
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#1B4332] to-[#0F2B1F] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <Link href="/community" className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Community
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">Gyedi Blog</h1>
              <p className="text-green-300/70 text-sm mt-1">Tips, guides &amp; news for safe trading</p>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => setShowModal(true)}
                className="flex-shrink-0 flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black text-sm px-5 py-2.5 rounded-xl transition-colors min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Write a Post
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="h-72 bg-[#1E293B] rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-52 bg-[#1E293B] rounded-2xl animate-pulse" />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-white/50 font-semibold text-lg">No posts yet</p>
            <p className="text-white/30 text-sm mt-1">Check back soon for articles and guides</p>
            {isLoggedIn && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-5 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-6 py-3 rounded-xl text-sm transition-colors"
              >
                Be the first to write
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured post */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden hover:border-[#F5A623]/30 transition-all duration-200"
              >
                {featured.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.coverImage} alt={featured.title} className="w-full h-56 sm:h-72 object-cover" />
                ) : (
                  <div className="w-full h-40 sm:h-56 bg-gradient-to-br from-[#1B4332] to-[#0F2B1F] flex items-center justify-center">
                    <span className="text-5xl opacity-30">📝</span>
                  </div>
                )}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(featured.tags ?? []).slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/10 px-2.5 py-1 rounded-full uppercase tracking-wide">{tag}</span>
                    ))}
                    <span className="text-[10px] text-white/30 bg-white/5 px-2.5 py-1 rounded-full ml-auto">{readTime(featured.excerpt ?? featured.title)}</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-white leading-snug group-hover:text-[#F5A623] transition-colors line-clamp-2">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-sm text-white/50 mt-2 line-clamp-2 leading-relaxed">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-4 text-xs text-white/30">
                    {featured.publishedAt && <span>{fmt(featured.publishedAt)}</span>}
                    <span>·</span>
                    <span>👁 {Number(featured.viewCount)}</span>
                    <span className="ml-auto text-[#F5A623] font-bold group-hover:underline">Read →</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest of posts — 3 column grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map(post => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden hover:border-[#F5A623]/30 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-lg hover:shadow-[#F5A623]/5 flex flex-col"
                  >
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImage} alt={post.title} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-28 bg-gradient-to-br from-[#1B4332]/60 to-[#0F172A] flex items-center justify-center">
                        <span className="text-3xl opacity-20">📝</span>
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      {(post.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(post.tags ?? []).slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[9px] font-bold text-[#F5A623]/80 bg-[#F5A623]/8 px-2 py-0.5 rounded-full uppercase tracking-wide">{tag}</span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-black text-white text-sm leading-snug line-clamp-2 group-hover:text-[#F5A623] transition-colors flex-1">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-white/40 mt-1.5 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-[10px] text-white/25">
                        {post.publishedAt && <span>{fmt(post.publishedAt)}</span>}
                        <span>·</span>
                        <span>{readTime(post.excerpt ?? post.title)}</span>
                        <span className="ml-auto">👁 {Number(post.viewCount)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Write Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-white text-lg">Write a Post</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors text-xl">✕</button>
            </div>

            {submitMsg ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-4xl">✅</div>
                <p className="text-white font-bold">{submitMsg}</p>
                <p className="text-white/50 text-sm">Your post will be published after admin review.</p>
                <button
                  onClick={() => { setShowModal(false); setSubmitMsg(''); }}
                  className="mt-2 bg-[#F5A623] text-[#1B4332] font-black px-5 py-2.5 rounded-xl text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 block mb-1.5 font-semibold">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    maxLength={300}
                    placeholder="Your post title"
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1.5 font-semibold">Excerpt (short summary)</label>
                  <input
                    value={form.excerpt}
                    onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                    maxLength={400}
                    placeholder="One or two sentences describing the post…"
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1.5 font-semibold">Body * ({form.body.length} chars)</label>
                  <textarea
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    rows={8}
                    placeholder="Write your post here…"
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1.5 font-semibold">Tags (comma-separated)</label>
                  <input
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="e.g. escrow, tips, guide"
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                </div>
                <p className="text-xs text-white/30 italic">Your post will be reviewed by our team before publishing.</p>
                {submitErr && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{submitErr}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black py-3 rounded-xl text-sm transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
