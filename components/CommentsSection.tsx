'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api.up.railway.app';

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
};

export default function CommentsSection({ listingId }: { listingId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [draft,    setDraft]    = useState('');
  const [posting,  setPosting]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    fetch(`${API}/api/social/comments/${listingId}`)
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  async function post() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { setError('Please sign in to comment.'); return; }
    if (!draft.trim()) return;
    setPosting(true); setError('');
    try {
      const res = await fetch(`${API}/api/social/comments/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setComments(prev => [...prev, data]); setDraft(''); }
      else setError(data.error ?? 'Failed to post comment');
    } catch { setError('Network error'); }
    setPosting(false);
  }

  return (
    <div>
      <h3 className="text-base font-black text-gray-900 mb-4">
        Questions &amp; Comments
        {comments.length > 0 && <span className="text-gray-400 font-normal text-sm ml-2">({comments.length})</span>}
      </h3>

      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.length === 0 && (
            <p className="text-sm text-gray-400">No comments yet. Be the first to ask a question!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {c.author.firstName[0]}
                </span>
                <span className="text-xs font-semibold text-gray-700">{c.author.firstName} {c.author.lastName}</span>
                <span className="text-xs text-gray-400 ml-auto">{new Date(c.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && post()}
          placeholder="Ask a question…"
          maxLength={500}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        />
        <button
          onClick={post}
          disabled={posting || !draft.trim()}
          className="px-4 py-2.5 bg-[#1B4332] text-white text-sm font-bold rounded-xl hover:bg-[#0F2B1F] disabled:opacity-50 transition-colors"
        >
          {posting ? '…' : 'Post'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
