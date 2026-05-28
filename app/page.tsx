import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/site-settings';
import StoreCarousel from '@/components/StoreCarousel';
import ProductCarousel from '@/components/ProductCarousel';
import SellerMosaic from '@/components/SellerMosaic';
import FlashDealsSection from '@/components/FlashDealsSection';
import SocialProofBanner from '@/components/SocialProofBanner';
import RecentlyViewed from '@/components/RecentlyViewed';

const CATEGORY_CARDS = [
  { label: 'Electronics',  icon: '📱', value: 'Electronics',  grad: 'from-blue-500 to-indigo-600' },
  { label: 'Fashion',      icon: '👗', value: 'Fashion',       grad: 'from-pink-500 to-rose-600' },
  { label: 'Vehicles',     icon: '🚗', value: 'Vehicles',      grad: 'from-orange-500 to-amber-600' },
  { label: 'Furniture',    icon: '🛋️', value: 'Furniture',     grad: 'from-emerald-500 to-teal-600' },
  { label: 'Agriculture',  icon: '🌾', value: 'Agriculture',   grad: 'from-lime-500 to-green-600' },
  { label: 'Services',     icon: '🔧', value: 'Services',      grad: 'from-purple-500 to-violet-600' },
];

const STEPS = [
  {
    title: 'List Your Item',
    desc:  'Post in minutes with photos and price. Reach verified buyers across Africa.',
    icon: (
      <svg className="w-7 h-7 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Buyer Pays to Escrow',
    desc:  "Funds locked safely — no money moves until both parties are satisfied.",
    icon: (
      <svg className="w-7 h-7 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Confirm & Get Paid',
    desc:  'Buyer confirms delivery. Funds released instantly to MoMo. Zero chargebacks.',
    icon: (
      <svg className="w-7 h-7 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const STATIC_TESTIMONIALS = [
  {
    name: 'Ama Darko', role: 'Electronics Seller · Accra', avatar: 'AD', rating: 5,
    quote: "Sold over GHS 15,000 worth of phones through Gyedi. Buyers trust me more because of escrow, and I get paid every time.",
  },
  {
    name: 'Kwame Asante', role: 'Buyer · Kumasi', avatar: 'KA', rating: 5,
    quote: "Bought a laptop from a stranger. Gyedi held my money until I confirmed it was legit. No risk, no stress at all.",
  },
  {
    name: 'Fatima Issah', role: 'Fashion Store · Tamale', avatar: 'FI', rating: 5,
    quote: "Upgraded to Pro and my sales doubled in a month. The featured placement alone was worth every pesewa.",
  },
];

const PLANS = [
  {
    name: 'Basic', price: 'Free', period: 'forever', highlight: false,
    features: ['Up to 3 active listings', 'Standard store page', 'Escrow on every sale', 'Gyedi trust badge'],
  },
  {
    name: 'Pro', price: 'GHS 50', period: 'per month', highlight: true,
    features: ['Unlimited listings', 'Custom store URL', 'Priority placement', 'Sales analytics', 'Pro seller badge', 'Email support'],
  },
  {
    name: 'Business', price: 'GHS 150', period: 'per month', highlight: false,
    features: ['Everything in Pro', 'Homepage featured', 'Business verification', 'Bulk listing tools', 'Dedicated manager', 'API access'],
  },
];

// ── Data fetchers ────────────────────────────────────────────────────────────

async function getFeaturedStores() {
  try {
    return await (prisma as any).user.findMany({
      where: { storeType: { in: ['PRO', 'BUSINESS', 'ENTERPRISE'] }, storeActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        averageRating: true, totalRatings: true,
        storeType: true, storeName: true, storeBanner: true, storeTheme: true,
        storeCategory: true,
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
      take: 12,
    });
  } catch { return []; }
}

async function getTrendingListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { views: 'desc' },
      take: 8,
      include: { seller: { select: { id: true, firstName: true, lastName: true, averageRating: true } } },
    });
  } catch { return []; }
}

async function getRecentListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { seller: { select: { id: true, firstName: true, lastName: true, averageRating: true } } },
    });
  } catch { return []; }
}

async function getFlashDeals() {
  try {
    return await (prisma as any).listing.findMany({
      where: { status: 'ACTIVE', flashDeal: true, flashDealExpiry: { gt: new Date() } },
      orderBy: { flashDealExpiry: 'asc' },
      take: 8,
      include: { seller: { select: { id: true, firstName: true, lastName: true } } },
    });
  } catch { return []; }
}

async function getTopSellers() {
  try {
    return await (prisma as any).user.findMany({
      where: { storeActive: true, kycStatus: 'APPROVED' },
      select: {
        id: true, firstName: true, lastName: true,
        storeName: true, avatarUrl: true,
        storeType: true, averageRating: true,
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { totalRatings: 'desc' },
      take: 16,
    });
  } catch { return []; }
}

async function getCategoryStats(): Promise<Record<string, number>> {
  try {
    const counts = await Promise.all(
      CATEGORY_CARDS.map(c => prisma.listing.count({ where: { status: 'ACTIVE', category: c.value } })),
    );
    return Object.fromEntries(CATEGORY_CARDS.map((c, i) => [c.value, counts[i]]));
  } catch { return {}; }
}

async function getSocialStats() {
  try {
    const [userCount, listingCount, dealCount] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { status: 'SOLD' } }),
    ]);
    return { userCount, listingCount, dealCount, tradedGhs: dealCount * 450 };
  } catch { return { userCount: 10000, listingCount: 5000, dealCount: 50000, tradedGhs: 2000000 }; }
}

async function getTestimonials() {
  try {
    const reviews = await (prisma as any).storeReview.findMany({
      where: { stars: { gte: 4 }, body: { not: null } },
      orderBy: { stars: 'desc' },
      take: 3,
      include: {
        reviewer: { select: { firstName: true, lastName: true } },
        seller:   { select: { storeName: true, firstName: true, lastName: true } },
      },
    });
    if (!reviews?.length) return null;
    return reviews.map((r: any) => ({
      name:   `${r.reviewer.firstName} ${r.reviewer.lastName}`,
      role:   r.seller.storeName || `${r.seller.firstName} ${r.seller.lastName}`,
      avatar: `${r.reviewer.firstName[0]}${r.reviewer.lastName[0]}`,
      rating: r.stars as number,
      quote:  r.body as string,
    }));
  } catch { return null; }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [
    featuredStores, trendingListings, recentListings,
    flashDeals, topSellers, catStats, socialStats,
    dbTestimonials, settings,
  ] = await Promise.all([
    getFeaturedStores(), getTrendingListings(), getRecentListings(),
    getFlashDeals(), getTopSellers(), getCategoryStats(), getSocialStats(),
    getTestimonials(), getSiteSettings(),
  ]);

  const testimonials = dbTestimonials?.length ? dbTestimonials : STATIC_TESTIMONIALS;
  const headline     = settings.heroHeadline || 'Buy & Sell';
  const subtext      = settings.heroSubtext  || 'Gyedi holds your payment securely until you confirm the deal is done. No scams, no chargebacks — just safe trades for everyone.';

  // Normalise listing shape for ProductCarousel
  const toProduct = (l: any) => ({
    id: l.id, title: l.title, price: l.price.toString(),
    images: l.images, category: l.category, storeType: l.storeType,
    views: l.views,
    seller: {
      id: l.seller.id,
      firstName: l.seller.firstName,
      lastName: l.seller.lastName,
      averageRating: l.seller.averageRating ? l.seller.averageRating.toString() : null,
    },
  });

  return (
    <div>

      {/* ── HERO ── */}
      <section className="relative bg-[#1B4332] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.13]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 -left-20 w-[350px] h-[350px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-28">
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            Escrow-Protected · Trusted Across Africa
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.03] tracking-tight max-w-3xl">
            {headline === 'Buy & Sell'
              ? (<>Buy &amp; Sell<br /><span className="text-[#F5A623]">with Confidence</span><br /><span className="text-white/60 text-3xl sm:text-4xl md:text-5xl font-extrabold">across Africa.</span></>)
              : headline}
          </h1>

          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">{subtext}</p>

          <form method="GET" action="/marketplace" className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                placeholder="Search phones, clothes, cars…"
                className="w-full pl-12 pr-4 py-4 bg-white/12 border border-white/25 rounded-2xl text-white placeholder-white/40 text-sm sm:text-base focus:outline-none focus:border-[#F5A623]/60 focus:bg-white/18 transition-colors"
              />
            </div>
            <button type="submit" className="bg-[#F5A623] hover:bg-[#D4881A] active:bg-[#B87315] text-[#1B4332] font-black px-8 py-4 rounded-2xl text-base sm:text-lg transition-all shadow-lg shadow-[#F5A623]/20 whitespace-nowrap">
              Search →
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: '🔒', label: 'Escrow Protected' },
              { icon: '✅', label: 'KYC Verified Sellers' },
              { icon: '⚡', label: 'Instant MoMo Payouts' },
            ].map(b => (
              <span key={b.label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full">
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF COUNTERS ── */}
      <SocialProofBanner
        userCount={socialStats.userCount}
        listingCount={socialStats.listingCount}
        dealCount={socialStats.dealCount}
        tradedGhs={socialStats.tradedGhs}
      />

      {/* ── CATEGORY GRID ── */}
      <section className="py-8 md:py-12 bg-[#F4F6F8] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-black text-gray-900">Shop by Category</h2>
            <Link href="/marketplace" className="text-[#1B4332] font-bold text-sm hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORY_CARDS.map(cat => {
              const count = catStats[cat.value] ?? 0;
              return (
                <Link
                  key={cat.value}
                  href={`/marketplace?category=${encodeURIComponent(cat.value)}`}
                  className="group rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className={`bg-gradient-to-br ${cat.grad} p-5 flex flex-col items-center text-center gap-2`}>
                    <span className="text-3xl">{cat.icon}</span>
                    <p className="text-white font-black text-sm leading-tight">{cat.label}</p>
                    {count > 0 && (
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{count} listings</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED STOREFRONTS (infinite carousel) ── */}
      {(featuredStores as any[]).length > 0 && (
        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 md:mb-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Trusted Sellers</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Featured Storefronts</h2>
              </div>
              <Link href="/marketplace" className="text-[#1B4332] font-bold text-sm hover:underline flex-shrink-0 ml-4">See all →</Link>
            </div>
          </div>
          <StoreCarousel stores={featuredStores as any} />
        </section>
      )}

      {/* ── TRENDING NOW ── */}
      {trendingListings.length > 0 && (
        <section className="py-10 md:py-16 bg-[#F4F6F8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-5 md:mb-8">
              <div>
                <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">🔥 Most Viewed</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Trending Now</h2>
              </div>
              <Link href="/marketplace?sort=views" className="text-[#1B4332] font-bold text-base hover:underline flex-shrink-0 ml-4">See all →</Link>
            </div>
            <ProductCarousel products={trendingListings.map(toProduct)} />
          </div>
        </section>
      )}

      {/* ── FLASH DEALS ── */}
      {(flashDeals as any[]).length > 0 && (
        <FlashDealsSection deals={flashDeals as any} />
      )}

      {/* ── RECENTLY LISTED ── */}
      {recentListings.length > 0 && (
        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-5 md:mb-8">
              <div>
                <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Just Added</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Recently Listed</h2>
              </div>
              <Link href="/marketplace?sort=new" className="text-[#1B4332] font-bold text-base hover:underline flex-shrink-0 ml-4">See all →</Link>
            </div>
            <ProductCarousel products={recentListings.map(toProduct)} />
          </div>
        </section>
      )}

      {/* ── TOP SELLERS MOSAIC ── */}
      {(topSellers as any[]).length > 0 && (
        <section className="py-10 md:py-16 bg-[#F4F6F8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 md:mb-8">
              <div>
                <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Our Community</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Top Sellers</h2>
                <p className="text-gray-400 text-sm mt-1">KYC-verified. Trusted by hundreds of buyers.</p>
              </div>
              <Link href="/marketplace" className="text-[#1B4332] font-bold text-sm hover:underline flex-shrink-0 ml-4">See all →</Link>
            </div>
            <SellerMosaic sellers={topSellers as any} />
          </div>
        </section>
      )}

      {/* ── RECENTLY VIEWED (client — reads localStorage) ── */}
      <RecentlyViewed />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">How Gyedi Works</h2>
            <p className="text-gray-400 mt-3 text-sm sm:text-base max-w-lg mx-auto">
              Three steps to trade safely with anyone, anywhere in Africa.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-8 relative">
            <div className="hidden sm:block absolute top-[52px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            {STEPS.map((step, i) => (
              <div key={step.title} className="bg-[#F4F6F8] rounded-2xl p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-100">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1B4332] mb-5 mx-auto shadow-lg shadow-[#1B4332]/20">
                  {step.icon}
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#F5A623] text-[#1B4332] text-[10px] font-black flex items-center justify-center shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-base leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="py-10 md:py-16 bg-[#F4F6F8] border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Why Gyedi</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Built for Trust</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🔒', title: 'Escrow Protected', desc: 'Funds held safely until both parties confirm' },
              { icon: '🪪', title: 'KYC Verified',     desc: 'Every seller identity-verified before listing' },
              { icon: '📱', title: 'MoMo Payouts',     desc: 'Instant MTN MoMo withdrawals to your wallet' },
              { icon: '⚖️', title: '24/7 Dispute Help', desc: 'Our team resolves disputes fast and fairly' },
            ].map(b => (
              <div key={b.title} className="bg-white rounded-2xl p-5 md:p-6 text-center border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-14 h-14 bg-[#F5A623]/15 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 text-3xl">{b.icon}</div>
                <h3 className="font-black text-gray-900 text-base md:text-lg">{b.title}</h3>
                <p className="text-gray-500 text-sm md:text-base mt-1.5 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Pricing</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Simple, Transparent Plans</h2>
            <p className="text-gray-400 mt-3 text-sm sm:text-base">Start free. Scale when you grow.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 md:p-8 border relative transition-all ${
                  plan.highlight
                    ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-2xl shadow-[#1B4332]/25 scale-[1.02] sm:scale-[1.03]'
                    : 'bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F5A623] text-[#1B4332] text-xs font-black px-4 py-1.5 rounded-full shadow">
                    MOST POPULAR
                  </span>
                )}
                <h3 className={`text-xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-[#F5A623]' : 'text-[#1B4332]'}`}>{plan.price}</span>
                  <span className={`text-sm ml-2 ${plan.highlight ? 'text-white/50' : 'text-gray-400'}`}>/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-white/80' : 'text-gray-600'}`}>
                      <span className={`mt-0.5 font-bold shrink-0 ${plan.highlight ? 'text-[#F5A623]' : 'text-[#1B4332]'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sell"
                  className={`block text-center font-bold py-4 rounded-xl transition-colors text-base ${
                    plan.highlight
                      ? 'bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.price === 'Free' ? 'Get Started Free' : `Start ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-12 md:py-24 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Community</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Loved by Traders</h2>
            <p className="text-gray-400 mt-3 text-sm md:text-base">Real stories from the Gyedi community</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((t: typeof STATIC_TESTIMONIALS[0]) => (
              <div key={t.name} className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-sm ${s <= t.rating ? 'text-[#F5A623]' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 text-base leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD CTA ── */}
      <section className="py-14 md:py-24 bg-[#1B4332] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 right-0 w-96 h-96 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-[#F5A623]/15 border border-[#F5A623]/20 text-[#F5A623] text-[11px] font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
            Mobile App
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">Trade Anywhere, Anytime</h2>
          <p className="text-white/50 text-sm sm:text-base mb-8 md:mb-10 max-w-lg mx-auto leading-relaxed">
            Download the Gyedi app to manage escrows, get paid instantly, and track every transaction on the go.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {settings.playStoreUrl && (
              <a href={settings.playStoreUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-[#1B4332] font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-xl text-base sm:text-lg w-full sm:w-auto justify-center">
                <svg className="w-5 h-5 text-[#F5A623] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l15 8.5c.6.34.6 1.26 0 1.6l-15 8.5c-.66.5-1.6.03-1.6-.8z"/>
                </svg>
                Download on Google Play
              </a>
            )}
            {settings.appStoreUrl && (
              <a href={settings.appStoreUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-[#1B4332] font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-xl text-base sm:text-lg w-full sm:w-auto justify-center">
                <svg className="w-5 h-5 text-[#F5A623] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download on App Store
              </a>
            )}
            {!settings.playStoreUrl && !settings.appStoreUrl && (
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-[#1B4332] font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-xl text-base sm:text-lg w-full sm:w-auto justify-center">
                <svg className="w-5 h-5 text-[#F5A623] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l15 8.5c.6.34.6 1.26 0 1.6l-15 8.5c-.66.5-1.6.03-1.6-.8z"/>
                </svg>
                Download on Google Play
              </a>
            )}
            <Link href="/marketplace"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/18 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base sm:text-lg w-full sm:w-auto justify-center">
              Browse on Web →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
