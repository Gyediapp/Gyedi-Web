'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Post = {
  id: string; title: string; body: string;
  upvotes: number; downvotes: number;
  isPinned: boolean; isLocked: boolean; viewCount: number;
  createdAt: string; categoryName: string; categorySlug: string;
  firstName: string; lastName: string; authorId: string;
};

type Reply = {
  id: string; body: string; upvotes: number; createdAt: string;
  firstName: string; lastName: string; authorId: string;
};

export default function ForumPostPage() {
  const params = useParams();
  const postId = params?.id as string;

  const [post,        setPost]        = useState<Post | null>(null);
  const [replies,     setReplies]     = useState<Reply[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [replyBody,   setReplyBody]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [replyError,  setReplyError]  = useState('');
  const [replyOk,     setReplyOk]     = useState('');
  const [voting,      setVoting]      = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetch(`${API}/forum/posts/${postId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.post) setPost(d.post);
        if (d?.replies) setReplies(d.replies);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleVote(vote: 1 | -1) {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`${API}/forum/posts/${postId}/vote`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (res.ok && data.post) {
        setPost(p => p ? { ...p, upvotes: Number(data.post.upvotes), downvotes: Number(data.post.downvotes) } : p);
      }
    } catch {}
    setVoting(false);
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (!replyBody.trim()) { setReplyError('Reply cannot be empty'); return; }

    setSubmitting(true);
    setReplyError('');
    setReplyOk('');
    try {
      const res = await fetch(`${API}/forum/posts/${postId}/replies`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ body: replyBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post reply');
      setReplyBody('');
      setReplyOk('Reply posted!');
      // Reload replies
      fetch(`${API}/forum/posts/${postId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.replies) setReplies(d.replies); })
        .catch(() => {});
      setTimeout(() => setReplyOk(''), 3000);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6">
        <a
          href={post ? `/community/forum/${post.categorySlug}` : '/community/forum'}
          className="text-green-300 text-sm hover:text-white block mb-2"
        >
          ← {post?.categoryName ?? 'Forum'}
        </a>
        {post && (
          <>
            <h1 className="text-white font-black text-lg leading-snug">{post.title}</h1>
            <p className="text-green-300 text-xs mt-1">
              by {post.firstName} {post.lastName} · {fmt(post.createdAt)}
            </p>
          </>
        )}
      </div>

      <div className="px-4 py-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-40 bg-white rounded-2xl animate-pulse" />
            <div className="h-20 bg-white rounded-2xl animate-pulse" />
          </div>
        ) : !post ? (
          <p className="text-center text-gray-400 py-12">Post not found</p>
        ) : (
          <>
            {/* Post body */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.body}</div>

              {/* Vote buttons */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                <button
                  onClick={() => handleVote(1)}
                  disabled={voting}
                  className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-sm px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  👍 <span>{Number(post.upvotes)}</span>
                </button>
                <button
                  onClick={() => handleVote(-1)}
                  disabled={voting}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  👎 <span>{Number(post.downvotes)}</span>
                </button>
                <span className="text-xs text-gray-400 ml-auto">👁 {Number(post.viewCount)} views</span>
              </div>
            </div>

            {/* Replies */}
            {replies.length > 0 && (
              <section>
                <h2 className="font-black text-gray-900 text-sm mb-3">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</h2>
                <div className="space-y-3">
                  {replies.map(reply => (
                    <div key={reply.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5A623] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                          {reply.firstName[0]}{reply.lastName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{reply.firstName} {reply.lastName}</p>
                          <p className="text-xs text-gray-400">{fmt(reply.createdAt)}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                          👍 {Number(reply.upvotes)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reply form */}
            {!post.isLocked ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-black text-gray-900 text-sm mb-3">Add a Reply</h3>
                <form onSubmit={handleReply} className="space-y-3">
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value.slice(0, 5000))}
                    rows={4}
                    placeholder="Share your thoughts…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 resize-none"
                  />
                  {replyError && <p className="text-xs text-red-500">{replyError}</p>}
                  {replyOk    && <p className="text-xs text-green-600">✓ {replyOk}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Posting…' : 'Post Reply'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-sm text-gray-500">🔒 This discussion is locked</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
