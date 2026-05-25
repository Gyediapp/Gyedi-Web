import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ListingCard from '@/components/ListingCard';

const CATEGORIES = [
  { label: 'All',          icon: '🛍️', value: '' },
  { label: 'Electronics',  icon: '📱', value: 'Electronics' },
  { label: 'Fashion',      icon: '👗', value: 'Fashion' },
  { label: 'Vehicles',     icon: '🚗', value: 'Vehicles' },
  { label: 'Furniture',    icon: '🛋️', value: 'Furniture' },
  { label: 'Agriculture',  icon: '🌾', value: 'Agriculture' },
  { label: 'Services',     icon: '🔧', value: 'Services' },
  { label: 'Real Estate',  icon: '🏠', value: 'Real Estate' },
  { label: 'Other',        icon: '📦', value: 'Other' },
];

const COUNTRIES = [
  { code: '', label: 'All Countries' },
  { code: 'GH', label: '🇬🇭 Ghana' },
  { code: 'NG', label: '🇳🇬 Nigeria' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'US', label: '🇺🇸 United States' },
];

const SORT_OPTIONS = [
  { value: '',           label: 'Newest First' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; country?: string; sort?: string }>;
}) {
  const { q, category, country, sort } = await searchParams;

  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      AND: [
        category ? { category } : {},
        country  ? { country }  : {},
        q
          ? {
              OR: [
                { title:       { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    },
    orderBy:
      sort === 'price_asc'  ? { price: 'asc' }   :
      sort === 'price_desc' ? { price: 'desc' }  :
      sort === 'popular'    ? { views: 'desc' }  :
      { createdAt: 'desc' },
    include: {
      seller: { select: { firstName: true, lastName: true, averageRating: true } },
    },
    take: 48,
  });

  const hasFilters = !!(q || category || country || sort);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* ── HERO HEADER ── */}
      <div className="relative bg-[#1B4332] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.1]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 65%)' }} />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-[#F5A623] text-[11px] font-bold uppercase tracking-widest mb-1">Gyedi Marketplace</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                {category ? category : 'All Listings'}
              </h1>
              {!hasFilters && (
                <p className="text-white/45 text-sm mt-1">Escrow-protected trades across Africa</p>
              )}
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-[#F5A623]/20 self-start sm:self-auto whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Sell an Item
            </Link>
          </div>

          {/* Search + filters */}
          <form method="GET" className="space-y-2.5">
            {/* preserve active category if set */}
            {category && <input type="hidden" name="category" value={category} />}

            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search phones, shoes, cars…"
                className="w-full pl-12 pr-4 py-3.5 bg-white/12 border border-white/25 rounded-2xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#F5A623]/60 focus:bg-white/18 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                name="category"
                defaultValue={category ?? ''}
                className="flex-1 min-w-[130px] px-3 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] [&>option]:text-gray-900"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <select
                name="country"
                defaultValue={country ?? ''}
                className="flex-1 min-w-[130px] px-3 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] [&>option]:text-gray-900"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <select
                name="sort"
                defaultValue={sort ?? ''}
                className="flex-1 min-w-[130px] px-3 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] [&>option]:text-gray-900"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-6 py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-[#F5A623]/20"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
            {CATEGORIES.map(cat => {
              const isActive = (cat.value === '' && !category) || cat.value === category;
              const href = cat.value
                ? `/marketplace?category=${encodeURIComponent(cat.value)}${q ? `&q=${encodeURIComponent(q)}` : ''}${sort ? `&sort=${sort}` : ''}`
                : `/marketplace${q ? `?q=${encodeURIComponent(q)}` : ''}${sort ? `${q ? '&' : '?'}sort=${sort}` : ''}`;
              return (
                <Link
                  key={cat.value}
                  href={href}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1B4332] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-[#F5A623]/15 hover:text-[#1B4332]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* results meta row */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{listings.length}</span>{' '}
            {listings.length === 1 ? 'listing' : 'listings'}
            {q && <> for <span className="font-semibold text-[#1B4332]">&ldquo;{q}&rdquo;</span></>}
            {category && !q && <> in <span className="font-semibold text-[#1B4332]">{category}</span></>}
          </p>
          {hasFilters && (
            <Link href="/marketplace" className="text-xs text-gray-400 hover:text-[#1B4332] font-semibold transition-colors">
              Clear filters ×
            </Link>
          )}
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
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">No listings found</h3>
            <p className="text-gray-500 mt-2 text-sm">Try different keywords or browse all categories</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Link href="/marketplace" className="bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Browse All
              </Link>
              <Link href="/sell" className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Sell Something
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── SELL CTA BANNER ── */}
      {listings.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="bg-[#1B4332] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
            <div>
              <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Got Something to Sell?</p>
              <h3 className="text-white font-black text-xl sm:text-2xl">Reach thousands of buyers</h3>
              <p className="text-white/50 text-sm mt-1">List for free. Get escrow protection on every sale.</p>
            </div>
            <Link
              href="/sell"
              className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-8 py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-[#F5A623]/20 whitespace-nowrap flex-shrink-0"
            >
              Start Selling Free →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
