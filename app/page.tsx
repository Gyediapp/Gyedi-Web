import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ListingCard from '@/components/ListingCard';

const CATEGORIES = [
  { label: 'Electronics',  icon: '📱', value: 'Electronics' },
  { label: 'Fashion',      icon: '👗', value: 'Fashion' },
  { label: 'Vehicles',     icon: '🚗', value: 'Vehicles' },
  { label: 'Furniture',    icon: '🛋️', value: 'Furniture' },
  { label: 'Agriculture',  icon: '🌾', value: 'Agriculture' },
  { label: 'Services',     icon: '🔧', value: 'Services' },
  { label: 'Real Estate',  icon: '🏠', value: 'Real Estate' },
  { label: 'Other',        icon: '📦', value: 'Other' },
];

const STEPS = [
  {
    num: '01',
    title: 'List Your Item',
    desc: 'Post your listing in minutes with photos, price, and description. Reach verified buyers across Africa.',
    icon: (
      <svg className="w-7 h-7 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Buyer Pays to Escrow',
    desc: "Funds are locked safely in Gyedi escrow — no money moves until both parties are satisfied.",
    icon: (
      <svg className="w-7 h-7 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Confirm & Get Paid',
    desc: 'Buyer confirms delivery. Funds released instantly to your MoMo wallet. Zero chargebacks.',
    icon: (
      <svg className="w-7 h-7 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    name: 'Ama Darko',
    role: 'Electronics Seller · Accra',
    avatar: 'AD',
    quote: "Sold over GHS 15,000 worth of phones through Gyedi. Buyers trust me more because of escrow, and I get paid every time.",
  },
  {
    name: 'Kwame Asante',
    role: 'Buyer · Kumasi',
    avatar: 'KA',
    quote: "Bought a laptop from a stranger. Gyedi held my money until I confirmed it was legit. No risk, no stress at all.",
  },
  {
    name: 'Fatima Issah',
    role: 'Fashion Store · Tamale',
    avatar: 'FI',
    quote: "Upgraded to Pro and my sales doubled in a month. The featured placement alone was worth every pesewa.",
  },
];

const PLANS = [
  {
    name: 'Basic',
    price: 'Free',
    period: 'forever',
    highlight: false,
    features: ['Up to 3 active listings', 'Standard store page', 'Escrow on every sale', 'Gyedi trust badge'],
  },
  {
    name: 'Pro',
    price: 'GHS 50',
    period: 'per month',
    highlight: true,
    features: ['Unlimited listings', 'Custom store URL', 'Priority placement', 'Sales analytics', 'Pro seller badge', 'Email support'],
  },
  {
    name: 'Business',
    price: 'GHS 150',
    period: 'per month',
    highlight: false,
    features: ['Everything in Pro', 'Homepage featured', 'Business verification', 'Bulk listing tools', 'Dedicated manager', 'API access'],
  },
];

async function getFeaturedListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { views: 'desc' },
      take: 8,
      include: { seller: { select: { firstName: true, lastName: true, averageRating: true } } },
    });
  } catch {
    return [];
  }
}

async function getFeaturedStores() {
  try {
    return await (prisma as any).user.findMany({
      where: { storeType: { in: ['PRO', 'BUSINESS', 'ENTERPRISE'] }, storeActive: true },
      select: {
        id: true, firstName: true, lastName: true, country: true,
        averageRating: true, totalRatings: true,
        storeType: true, storeName: true, storeBanner: true, storeTheme: true,
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
      take: 6,
    });
  } catch {
    return [];
  }
}

const FEATURED_THEME_BG: Record<string, string> = {
  Bold:         'from-[#1B4332] to-[#0F2B1F]',
  Warm:         'from-amber-700 to-orange-900',
  Professional: 'from-slate-700 to-slate-900',
  Minimal:      'from-gray-100 to-gray-200',
};

const TIER_LABEL: Record<string, string> = {
  PRO: '★ Pro', BUSINESS: '✦ Business', ENTERPRISE: '◆ Enterprise',
};

export default async function HomePage() {
  const [listings, featuredStores] = await Promise.all([getFeaturedListings(), getFeaturedStores()]);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative bg-[#1B4332] overflow-hidden">
        {/* background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.13]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 -left-20 w-[350px] h-[350px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-28">
          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            Escrow-Protected · Trusted Across Africa
          </div>

          {/* heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.03] tracking-tight max-w-3xl">
            Buy &amp; Sell<br />
            <span className="text-[#F5A623]">with Confidence</span><br />
            <span className="text-white/60 text-3xl sm:text-4xl md:text-5xl font-extrabold">across Africa.</span>
          </h1>

          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
            Gyedi holds your payment securely until you confirm the deal is done.
            No scams, no chargebacks — just safe trades for everyone.
          </p>

          {/* search bar */}
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
            <button
              type="submit"
              className="bg-[#F5A623] hover:bg-[#D4881A] active:bg-[#B87315] text-[#1B4332] font-black px-8 py-4 rounded-2xl text-base sm:text-lg transition-all shadow-lg shadow-[#F5A623]/20 whitespace-nowrap"
            >
              Search →
            </button>
          </form>

          {/* stats */}
          <div className="mt-10 sm:mt-12 flex flex-wrap gap-x-8 gap-y-4 sm:gap-x-12">
            {[
              { value: '10,000+', label: 'Verified Users' },
              { value: 'GHS 2M+', label: 'Safely Traded' },
              { value: '50,000+', label: 'Completed Deals' },
            ].map((s, i) => (
              <div key={s.label} className={i > 0 ? 'sm:border-l sm:border-white/10 sm:pl-8' : ''}>
                <p className="text-2xl sm:text-3xl font-black text-white">{s.value}</p>
                <p className="text-white/40 text-xs sm:text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ── */}
      <section className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-4">
            <Link
              href="/marketplace"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#1B4332] text-white shadow-sm transition-all"
            >
              All Items
            </Link>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.value}
                href={`/marketplace?category=${encodeURIComponent(cat.value)}`}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold bg-gray-100 hover:bg-[#F5A623]/15 hover:text-[#1B4332] text-gray-600 transition-all"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-[#0F2B1F] py-3.5 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-2">
            <span className="text-white/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Available in</span>
            {['🇬🇭 Ghana', '🇳🇬 Nigeria', '🇬🇧 UK', '🇩🇪 Germany', '🇺🇸 USA'].map(c => (
              <span key={c} className="text-white/50 text-xs sm:text-sm font-medium">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ── */}
      <section className="py-10 md:py-16 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-5 md:mb-8">
            <div>
              <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Trending Now</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Featured Listings</h2>
            </div>
            <Link href="/marketplace" className="text-[#1B4332] font-bold text-base hover:underline flex-shrink-0 ml-4">
              View all →
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {listings.map((l: any) => (
                <ListingCard
                  key={l.id}
                  id={l.id}
                  title={l.title}
                  price={l.price.toString()}
                  images={l.images}
                  category={l.category}
                  country={l.country}
                  storeType={l.storeType}
                  views={l.views}
                  sellerName={`${l.seller.firstName} ${l.seller.lastName}`}
                  sellerRating={l.seller.averageRating ? parseFloat(l.seller.averageRating.toString()) : null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-[#1B4332]/8 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-[#1B4332]/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Be the First Seller</h3>
              <p className="text-gray-500 mt-2 mb-6 text-sm max-w-xs mx-auto">No listings yet. Create yours and reach thousands of buyers across Africa.</p>
              <Link href="/sell" className="bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-base">
                Create a Listing
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED STORES ── */}
      {(featuredStores as any[]).length > 0 && (
        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-5 md:mb-8">
              <div>
                <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Trusted Sellers</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Featured Stores</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {(featuredStores as any[]).map((store: any) => {
                const bg   = FEATURED_THEME_BG[store.storeTheme] ?? FEATURED_THEME_BG.Bold;
                const name = store.storeName || `${store.firstName} ${store.lastName}`;
                const initials = `${store.firstName[0]}${store.lastName[0]}`;
                return (
                  <a key={store.id} href={`/store/${store.id}`}
                    className="group rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                    {/* Banner */}
                    <div className={`relative h-28 bg-gradient-to-br ${bg} flex items-end p-4`}>
                      {store.storeBanner && (
                        <img src={store.storeBanner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity" />
                      )}
                      <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-sm">
                          {initials}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm leading-tight">{name}</p>
                          <p className="text-white/60 text-xs">{TIER_LABEL[store.storeType] ?? store.storeType}</p>
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {store.averageRating && <span>⭐ {parseFloat(store.averageRating.toString()).toFixed(1)} · </span>}
                        {store._count?.listings ?? 0} listing{store._count?.listings !== 1 ? 's' : ''}
                      </div>
                      <span className="text-[#1B4332] text-xs font-bold group-hover:underline">Visit →</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
              <div key={step.num} className="bg-[#F4F6F8] rounded-2xl p-6 md:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-100">
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
              {
                icon: (
                  <svg className="w-7 h-7 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Escrow Protected',
                desc: 'Funds held safely until both parties confirm',
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'KYC Verified',
                desc: 'Every seller identity-verified before listing',
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ),
                title: 'MoMo Payouts',
                desc: 'Instant MTN MoMo withdrawals to your wallet',
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                title: '24/7 Dispute Help',
                desc: 'Our team resolves disputes fast and fairly',
              },
            ].map(b => (
              <div key={b.title} className="bg-white rounded-2xl p-5 md:p-6 text-center border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-14 h-14 bg-[#F5A623]/15 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  {b.icon}
                </div>
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
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-[#F5A623] text-sm">★</span>)}
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
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-[#1B4332] font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-xl text-base sm:text-lg w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5 text-[#F5A623] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l15 8.5c.6.34.6 1.26 0 1.6l-15 8.5c-.66.5-1.6.03-1.6-.8z"/>
              </svg>
              Download on Google Play
            </a>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/18 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base sm:text-lg w-full sm:w-auto justify-center"
            >
              Browse on Web →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
