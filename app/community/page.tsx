'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Category = {
  id: string; name: string; slug: string; description: string | null;
  icon: string | null; color: string; postCount: number;
};

type Post = {
  id: string; title: string; body: string; upvotes: number;
  createdAt: string; categoryName: string; categorySlug: string;
  firstName: string; lastName: string; replyCount: number | string;
};

type LeaderUser = {
  userId: string; points: number; firstName: string; lastName: string;
};

type BlogPost = {
  id: string; title: string; slug: string; excerpt: string | null;
  coverImage: string | null; publishedAt: string | null; tags: string[];
};

export default function CommunityPage() {
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderUser[]>([]);
  const [blogPosts,   setBlogPosts]   = useState<BlogPost[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/forum/`).then(r => r.ok ? r.json() : { categories: [] }),
      fetch(`${API}/forum/posts?limit=5`).then(r => r.ok ? r.json() : { posts: [] }),
      fetch(`${API}/points/leaderboard`).then(r => r.ok ? r.json() : { leaderboard: [] }),
      fetch(`${API}/blog?limit=3`).then(r => r.ok ? r.json() : { posts: [] }),
    ])
      .then(([cats, postsData, lb, blog]) => {
        setCategories(cats.categories ?? []);
        setPosts(postsData.posts ?? []);
        setLeaderboard(lb.leaderboard ?? []);
        setBlogPosts(blog.posts ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const MEDAL = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Hero */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-8 md:pt-14 md:pb-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white font-black text-2xl md:text-3xl lg:text-4xl">Gyedi Community</h1>
          <p className="text-green-300 text-sm md:text-base mt-1">Learn, Share, Grow 🇬🇭</p>
          <div className="flex gap-3 mt-4">
            <a href="/community/forum"
              className="bg-[#F5A623] text-[#1B4332] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#D4881A] transition-colors min-h-[44px] flex items-center">
              Browse Forum
            </a>
            <a href="/blog"
              className="bg-white/10 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors min-h-[44px] flex items-center">
              Read Blog
            </a>
          </div>
        </div>
      </div>

      {/* Body — 70/30 grid on desktop */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">

        {/* ── Main content ── */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Forum Categories */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-gray-900 text-base md:text-lg">Forum</h2>
                  <a href="/community/forum" className="text-[#1B4332] text-xs font-bold hover:underline">See all →</a>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.slice(0, 6).map(cat => (
                    <a
                      key={cat.id}
                      href={`/community/forum/${cat.slug}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-2xl mb-2">{cat.icon ?? '💬'}</div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{cat.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{cat.postCount} posts</p>
                    </a>
                  ))}
                </div>
              </section>

              {/* Recent Discussions */}
              {posts.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black text-gray-900 text-base md:text-lg">Recent Discussions</h2>
                    <a href="/community/forum" className="text-[#1B4332] text-xs font-bold hover:underline">See all →</a>
                  </div>
                  <div className="space-y-2">
                    {posts.map(post => (
                      <a
                        key={post.id}
                        href={`/community/forum/post/${post.id}`}
                        className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1B4332] font-semibold mb-0.5">{post.categoryName}</p>
                          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{post.title}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-gray-400">{post.firstName} {post.lastName}</span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">👍 {Number(post.upvotes)}</span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">💬 {Number(post.replyCount)}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Leaderboard + Blog — mobile only (shown inline below posts) */}
              <div className="lg:hidden space-y-6">
                {leaderboard.length > 0 && <LeaderboardSection leaderboard={leaderboard} MEDAL={MEDAL} />}
                {blogPosts.length > 0 && <BlogSection blogPosts={blogPosts} />}
              </div>
            </>
          )}
        </div>

        {/* ── Sidebar (desktop only) ── */}
        {!loading && (
          <aside className="hidden lg:flex flex-col gap-6 sticky top-20">
            {leaderboard.length > 0 && <LeaderboardSection leaderboard={leaderboard} MEDAL={MEDAL} />}
            {blogPosts.length > 0 && <BlogSection blogPosts={blogPosts} />}
          </aside>
        )}

      </div>
    </div>
  );
}

function LeaderboardSection({ leaderboard, MEDAL }: { leaderboard: LeaderUser[]; MEDAL: string[] }) {
  return (
    <section>
      <h2 className="font-black text-gray-900 text-base mb-3">Top Contributors</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {leaderboard.slice(0, 5).map((user, idx) => (
          <div key={user.userId} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <span className="text-xl w-8 text-center flex-shrink-0">
              {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
            </div>
            <div className="flex items-center gap-1 bg-[#F5A623]/10 px-2.5 py-1 rounded-full">
              <span className="text-xs">🪙</span>
              <span className="text-xs font-black text-[#D4881A]">{Number(user.points).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogSection({ blogPosts }: { blogPosts: BlogPost[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black text-gray-900 text-base">Latest Blog</h2>
        <a href="/blog" className="text-[#1B4332] text-xs font-bold hover:underline">See all →</a>
      </div>
      <div className="space-y-3">
        {blogPosts.map(bp => (
          <a
            key={bp.id}
            href={`/blog/${bp.slug}`}
            className="flex gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors"
          >
            {bp.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bp.coverImage} alt={bp.title} className="w-16 h-14 object-cover rounded-xl flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{bp.title}</p>
              {bp.publishedAt && (
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(bp.publishedAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
