'use client';

import { useEffect, useRef, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const REPLIES_PREVIEW = 2;

type QAComment = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  isSeller: boolean;
  verifiedBuyer: boolean;
  author: { id: string; firstName: string; lastName: string };
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(first: string, last: string) {
  return `${(first[0] ?? '').toUpperCase()}${(last[0] ?? '').toUpperCase()}`;
}

const AVATAR_COLORS = ['#1B4332', '#7C3AED', '#0369A1', '#B45309', '#15803D', '#9D174D'];
function avatarBg(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ name, lg = false, isSeller = false, isVerified = false }: {
  name: string; lg?: boolean; isSeller?: boolean; isVerified?: boolean;
}) {
  const bg   = avatarBg(name);
  const ring = isSeller ? '2px solid #F5A623' : isVerified ? '2px solid #22c55e' : 'none';
  return (
    <div className={`${lg ? 'w-8 h-8 text-xs' : 'w-7 h-7 text-[11px]'} rounded-full flex items-center justify-center text-white font-black flex-shrink-0`}
      style={{ backgroundColor: bg, outline: ring, outlineOffset: '2px' }}>
      {initials(name.split(' ')[0] ?? '', name.split(' ')[1] ?? '')}
    </div>
  );
}

function SellerBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#F5A623] text-[#1B4332] flex-shrink-0 shadow-sm">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 3a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H3z" />
        <path fillRule="evenodd" d="M7 16a1 1 0 110 2 1 1 0 010-2zm7 0a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" />
      </svg>
      Store Owner
    </span>
  );
}

function VerifiedBuyerBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Verified Buyer
    </span>
  );
}

function CommentBody({ body }: { body: string }) {
  const mention = body.match(/^(@\S+)(\s|$)/);
  if (mention) {
    return (
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
        <span className="text-[#F5A623] font-bold">{mention[1]}</span>
        {body.slice(mention[1].length)}
      </p>
    );
  }
  return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{body}</p>;
}

function ReplyForm({ mention, listingId, parentId, onPosted, onCancel }: {
  mention: string; listingId: string; parentId: string;
  onPosted: (c: QAComment) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(`@${mention} `);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  async function submit() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { setErr('Sign in to reply'); return; }
    if (!draft.trim()) return;
    setPosting(true); setErr('');
    try {
      const res = await fetch(`${API}/social/comments/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: draft.trim(), parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      onPosted(data as QAComment);
      setDraft('');
    } catch (e: any) { setErr(e.message ?? 'Failed to post'); }
    setPosting(false);
  }

  return (
    <div className="mt-3 pl-10 space-y-2">
      <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value.slice(0, 2000))} rows={2}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] resize-none transition-colors"
        placeholder={`Reply to @${mention}…`}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={posting || !draft.trim()}
          className="bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
          {posting ? 'Posting…' : 'Post Reply'}
        </button>
        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
      </div>
    </div>
  );
}

export default function QASection({ listingId, sellerId }: { listingId: string; sellerId?: string }) {
  const [comments,     setComments]     = useState<QAComment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [draft,        setDraft]        = useState('');
  const [posting,      setPosting]      = useState(false);
  const [error,        setError]        = useState('');
  const [replyTarget,  setReplyTarget]  = useState<{ parentId: string; mention: string } | null>(null);
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set());
  const [myId,         setMyId]         = useState('');
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editDraft,    setEditDraft]    = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gyedi_user');
      if (stored) setMyId(JSON.parse(stored).id);
    } catch {}
  }, []);

  useEffect(() => {
    fetch(`${API}/social/comments/${listingId}`)
      .then(r => r.ok ? r.json() : [])
      .then((d: QAComment[]) => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  const threads    = comments.filter(c => !c.parentId);
  const getReplies = (id: string) => comments.filter(c => c.parentId === id);
  const totalCount = comments.length;

  async function postQuestion() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { setError('Please sign in to ask a question.'); return; }
    if (!draft.trim()) return;
    setPosting(true); setError('');
    try {
      const res = await fetch(`${API}/social/comments/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setComments(prev => [...prev, data as QAComment]);
      setDraft('');
    } catch (e: any) { setError(e.message ?? 'Failed to post'); }
    setPosting(false);
  }

  async function deleteComment(commentId: string) {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    if (!confirm('Delete this comment?')) return;
    try {
      await fetch(`${API}/social/comments/${listingId}/${commentId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  }

  async function editComment(commentId: string) {
    const token = localStorage.getItem('gyedi_token');
    if (!token || !editDraft.trim()) return;
    try {
      const res = await fetch(`${API}/social/comments/${listingId}/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: editDraft.trim() }),
      });
      const data = await res.json() as { id: string; body: string };
      if (res.ok) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, body: data.body } : c));
        setEditingId(null);
      }
    } catch {}
  }

  function addComment(c: QAComment) {
    setComments(prev => [...prev, c]);
    setReplyTarget(null);
  }

  function toggleExpand(threadId: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(threadId) ? next.delete(threadId) : next.add(threadId);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-black text-gray-900">
          Questions &amp; Answers
          {totalCount > 0 && <span className="text-gray-400 font-normal text-sm ml-2">({totalCount})</span>}
        </h3>
      </div>

      <div className="flex gap-3 mb-6">
        <textarea value={draft} onChange={e => setDraft(e.target.value.slice(0, 2000))} rows={2}
          placeholder="Ask a question about this listing…"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postQuestion(); } }}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] resize-none transition-colors" />
        <button onClick={postQuestion} disabled={posting || !draft.trim()}
          className="self-end bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-50 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors flex-shrink-0">
          {posting ? '…' : 'Ask'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mb-4 -mt-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm text-gray-500">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map(thread => {
            const replies    = getReplies(thread.id);
            const isExpanded = expanded.has(thread.id);
            const isMe       = myId === thread.author.id;

            return (
              <div key={thread.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar name={`${thread.author.firstName} ${thread.author.lastName}`} lg isSeller={thread.isSeller} isVerified={thread.verifiedBuyer} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{thread.author.firstName} {thread.author.lastName}</span>
                      {thread.isSeller && <SellerBadge />}
                      {thread.verifiedBuyer && <VerifiedBuyerBadge />}
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{timeAgo(thread.createdAt)}</span>
                    </div>
                    {editingId === thread.id ? (
                      <div className="space-y-2">
                        <textarea value={editDraft} onChange={e => setEditDraft(e.target.value)} rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => editComment(thread.id)} className="bg-[#1B4332] text-white text-xs font-bold px-4 py-2 rounded-xl">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 px-3 py-2">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <CommentBody body={thread.body} />
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => setReplyTarget(replyTarget?.parentId === thread.id ? null : { parentId: thread.id, mention: thread.author.firstName })}
                        className="text-xs font-semibold text-[#1B4332] hover:underline">Reply</button>
                      {isMe && (<>
                        <button onClick={() => { setEditingId(thread.id); setEditDraft(thread.body); }}
                          className="text-xs text-gray-400 hover:text-[#1B4332]">Edit</button>
                        <button onClick={() => deleteComment(thread.id)}
                          className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </>)}
                    </div>
                  </div>
                </div>

                {replyTarget?.parentId === thread.id && !replyTarget.mention.includes(' ') && (
                  <ReplyForm mention={replyTarget.mention} listingId={listingId} parentId={thread.id} onPosted={addComment} onCancel={() => setReplyTarget(null)} />
                )}

                {replies.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-[#F5A623]/30 space-y-3">
                    {replies.map((reply, idx) => {
                      const visible  = idx < REPLIES_PREVIEW || isExpanded;
                      const isMeReply = myId === reply.author.id;
                      return (
                        <div key={reply.id} className="transition-all duration-300 overflow-hidden"
                          style={{ maxHeight: visible ? '600px' : '0px', opacity: visible ? 1 : 0 }}>
                          <div className="flex items-start gap-2.5">
                            <Avatar name={`${reply.author.firstName} ${reply.author.lastName}`} isSeller={reply.isSeller} isVerified={reply.verifiedBuyer} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-gray-900">{reply.author.firstName} {reply.author.lastName}</span>
                                {reply.isSeller && <SellerBadge />}
                                {reply.verifiedBuyer && <VerifiedBuyerBadge />}
                                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{timeAgo(reply.createdAt)}</span>
                              </div>
                              {editingId === reply.id ? (
                                <div className="space-y-2">
                                  <textarea value={editDraft} onChange={e => setEditDraft(e.target.value)} rows={2}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 resize-none" />
                                  <div className="flex gap-2">
                                    <button onClick={() => editComment(reply.id)} className="bg-[#1B4332] text-white text-xs font-bold px-4 py-2 rounded-xl">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 px-3 py-2">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <CommentBody body={reply.body} />
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                <button onClick={() => setReplyTarget(replyTarget?.parentId === thread.id && replyTarget.mention === reply.author.firstName ? null : { parentId: thread.id, mention: reply.author.firstName })}
                                  className="text-xs font-semibold text-[#1B4332] hover:underline">Reply</button>
                                {isMeReply && (<>
                                  <button onClick={() => { setEditingId(reply.id); setEditDraft(reply.body); }}
                                    className="text-xs text-gray-400 hover:text-[#1B4332]">Edit</button>
                                  <button onClick={() => deleteComment(reply.id)}
                                    className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                </>)}
                              </div>
                            </div>
                          </div>

                          {replyTarget?.parentId === thread.id && replyTarget.mention === reply.author.firstName && (
                            <ReplyForm mention={replyTarget.mention} listingId={listingId} parentId={thread.id} onPosted={addComment} onCancel={() => setReplyTarget(null)} />
                          )}
                        </div>
                      );
                    })}

                    {replies.length > REPLIES_PREVIEW && (
                      <button onClick={() => toggleExpand(thread.id)}
                        className="text-xs font-semibold text-[#1B4332] hover:underline transition-colors">
                        {isExpanded ? '↑ Show fewer' : `↓ Show ${replies.length - REPLIES_PREVIEW} more ${replies.length - REPLIES_PREVIEW === 1 ? 'reply' : 'replies'}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}