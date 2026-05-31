'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ShareButtons from '@/components/ShareButtons';

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

const AVATAR_COLORS = ['#F5A623', '#1B4332', '#7C3AED', '#0369A1', '#B45309', '#15803D'];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(first: string, last: string) {
  return `${(first[0] ?? '').toUpperCase()}${(last[0] ?? '').toUpperCase()}`;
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
function getMyId(): string | null {
  try {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub ?? null;
  } catch { return null; }
}

export default function ForumPostPage() {
  const params  = useParams();
  const router  = useRouter();
  const postId  = params?.id as string;

  const [post,        setPost]        = useState<Post | null>(null);
  const [replies,     setReplies]     = useState<Reply[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [replyBody,   setReplyBody]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [replyError,  setReplyError]  = useState('');
  const [replyOk,     setReplyOk]     = useState('');
  const [voting,      setVoting]      = useState(false);
  const [shareUrl,    setShareUrl]    = useState('');
  const [myId,        setMyId]        = useState<string | null>(null);

  // Edit post state
  const [editing,     setEditing]     = useState(false);
  const [editTitle,   setEditTitle]   = useState('');
  const [editBody,    setEditBody]    = useState('');
  const [editSaving,  setEditSaving]  = useState(false);
  const [editError,   setEditError]   = useState('');

  // Delete post state
  const [deleting,    setDeleting]    = useState(false);

  // Reply actions
  const [replyVoting, setReplyVoting] = useState<Record<string, boolean>>({});
  const [replyDeleting, setReplyDeleting] = useState<Record<string, boolean>>({});

  // Report state
  const [reporting,   setReporting]   = useState<string | null>(null); // postId or replyId
  const [reportReason, setReportReason] = useState('');
  const [reportOk,    setReportOk]    = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
      setMyId(getMyId());
    }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vote }),
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post reply');
      setReplyBody('');
      setReplyOk('Reply posted!');
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

  // ── Edit post ──────────────────────────────────────────────────────────────
  function startEdit() {
    if (!post) return;
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditError('');
    setEditing(true);
  }

  async function saveEdit() {
    const token = localStorage.getItem('gyedi_token');
    if (!token || !post) return;
    if (!editTitle.trim() || !editBody.trim()) { setEditError('Title and body are required'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`${API}/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle.trim(), body: editBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      setPost(p => p ? { ...p, title: editTitle.trim(), body: editBody.trim() } : p);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setEditSaving(false);
    }
  }

  // ── Delete post ────────────────────────────────────────────────────────────
  async function deletePost() {
    if (!confirm('Delete this post permanently? This cannot be undone.')) return;
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/community/forum');
    } catch {
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  // ── Upvote reply ───────────────────────────────────────────────────────────
  async function upvoteReply(replyId: string) {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    if (replyVoting[replyId]) return;
    setReplyVoting(prev => ({ ...prev, [replyId]: true }));
    try {
      const res = await fetch(`${API}/forum/replies/${replyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vote: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setReplies(prev => prev.map(r => r.id === replyId ? { ...r, upvotes: Number(data.reply.upvotes) } : r));
      }
    } catch {}
    setReplyVoting(prev => ({ ...prev, [replyId]: false }));
  }

  // ── Delete reply ───────────────────────────────────────────────────────────
  async function deleteReply(replyId: string) {
    if (!confirm('Delete this reply?')) return;
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setReplyDeleting(prev => ({ ...prev, [replyId]: true }));
    try {
      const res = await fetch(`${API}/forum/replies/${replyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setReplies(prev => prev.filter(r => r.id !== replyId));
    } catch {
      alert('Failed to delete reply.');
    } finally {
      setReplyDeleting(prev => ({ ...prev, [replyId]: false }));
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  async function submitReport() {
    const token = localStorage.getItem('gyedi_token');
    if (!token || !reporting) return;
    if (!reportReason.trim()) return;
    try {
      await fetch(`${API}/forum/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetId: reporting, reason: reportReason.trim() }),
      });
      setReportOk('Report submitted. Thank you.');
      setTimeout(() => { setReporting(null); setReportReason(''); setReportOk(''); }, 2000);
    } catch {
      alert('Failed to submit report.');
    }
  }

  const isMyPost = myId && post && myId === post.authorId;

  return (
    <div className="min-h-screen bg-[#0F172A]">

      {/* Report modal */}
      {reporting && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h3 className="font-black text-white text-base mb-4">Report Content</h3>
            {reportOk ? (
              <p className="text-green-400 text-sm text-center py-4">{reportOk}</p>
            ) : (
              <>
                <textarea
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  rows={3}
                  placeholder="Describe why you are reporting this..."
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 resize-none mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setReporting(null); setReportReason(''); }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReport}
                    disabled={!reportReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#1B4332] to-[#0F2B1F] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <Link
            href={post ? `/community/forum/${post.categorySlug}` : '/community/forum'}
            className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {post?.categoryName ?? 'Forum'}
          </Link>
          {post && !editing && (
            <>
              <h1 className="text-xl md:text-2xl font-black text-white leading-snug break-words">{post.title}</h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#1B4332] font-black text-[10px] flex-shrink-0"
                  style={{ backgroundColor: avatarColor(`${post.firstName}${post.lastName}`) }}
                >
                  {initials(post.firstName, post.lastName)}
                </div>
                <span className="text-green-300/80 text-sm font-medium">{post.firstName} {post.lastName}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40 text-xs">{timeAgo(post.createdAt)}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40 text-xs">👁 {Number(post.viewCount)} views</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 bg-[#1E293B] rounded-2xl animate-pulse" />
            <div className="h-24 bg-[#1E293B] rounded-2xl animate-pulse" />
          </div>
        ) : !post ? (
          <div className="text-center py-20">
            <p className="text-white/50 font-semibold">Post not found</p>
            <Link href="/community/forum" className="text-[#F5A623] text-sm hover:underline mt-2 block">← Back to Forum</Link>
          </div>
        ) : (
          <>
            {/* Post body */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 sm:p-6">

              {/* Edit form */}
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    maxLength={200}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]/50 transition-colors font-bold"
                    placeholder="Post title"
                  />
                  <textarea
                    value={editBody}
                    onChange={e => setEditBody(e.target.value.slice(0, 10000))}
                    rows={6}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]/50 transition-colors resize-none"
                    placeholder="Post body"
                  />
                  {editError && <p className="text-xs text-red-400">{editError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="flex-1 bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{post.body}</div>
              )}

              {/* Vote + share + actions */}
              {!editing && (
                <div className="mt-5 pt-5 border-t border-white/5 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => handleVote(1)}
                      disabled={voting}
                      className="flex items-center gap-1.5 bg-[#F5A623]/10 hover:bg-[#F5A623]/20 text-[#F5A623] font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      👍 <span>{Number(post.upvotes)}</span>
                    </button>
                    <button
                      onClick={() => handleVote(-1)}
                      disabled={voting}
                      className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      👎 <span>{Number(post.downvotes)}</span>
                    </button>
                    <span className="text-xs text-white/30 ml-auto">💬 {replies.length} replies</span>

                    {/* Owner actions */}
                    {isMyPost && !post.isLocked && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={startEdit}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={deletePost}
                          disabled={deleting}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}

                    {/* Report (not own post) */}
                    {!isMyPost && (
                      <button
                        onClick={() => setReporting(postId)}
                        className="text-xs text-white/20 hover:text-red-400 transition-colors ml-1"
                        title="Report post"
                      >
                        🚩
                      </button>
                    )}
                  </div>
                  {shareUrl && (
                    <ShareButtons url={shareUrl} title={post.title} compact />
                  )}
                </div>
              )}
            </div>

            {/* Replies */}
            {replies.length > 0 && (
              <section>
                <h2 className="font-black text-white/80 text-sm mb-3">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</h2>
                <div className="space-y-3">
                  {replies.map(reply => (
                    <div key={reply.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] flex-shrink-0"
                          style={{ backgroundColor: avatarColor(`${reply.firstName}${reply.lastName}`), color: '#fff' }}
                        >
                          {initials(reply.firstName, reply.lastName)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white/80">{reply.firstName} {reply.lastName}</p>
                          <p className="text-xs text-white/30">{timeAgo(reply.createdAt)}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          {/* Upvote reply */}
                          <button
                            onClick={() => upvoteReply(reply.id)}
                            disabled={replyVoting[reply.id]}
                            className="flex items-center gap-1 text-xs text-white/30 hover:text-[#F5A623] transition-colors disabled:opacity-50"
                          >
                            👍 {Number(reply.upvotes)}
                          </button>
                          {/* Delete own reply */}
                          {myId === reply.authorId && (
                            <button
                              onClick={() => deleteReply(reply.id)}
                              disabled={replyDeleting[reply.id]}
                              className="text-xs text-white/20 hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Delete reply"
                            >
                              🗑
                            </button>
                          )}
                          {/* Report reply */}
                          {myId !== reply.authorId && (
                            <button
                              onClick={() => setReporting(reply.id)}
                              className="text-xs text-white/20 hover:text-red-400 transition-colors"
                              title="Report reply"
                            >
                              🚩
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{reply.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reply form */}
            {!post.isLocked ? (
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
                <h3 className="font-black text-white/80 text-sm mb-3">Add a Reply</h3>
                <form onSubmit={handleReply} className="space-y-3">
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value.slice(0, 5000))}
                    rows={4}
                    placeholder="Share your thoughts..."
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors resize-none"
                  />
                  {replyError && <p className="text-xs text-red-400">{replyError}</p>}
                  {replyOk    && <p className="text-xs text-green-400">✔ {replyOk}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black py-3 rounded-xl text-sm transition-colors"
                  >
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-sm text-white/40">🔒 This discussion is locked</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
