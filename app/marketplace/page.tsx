import { prisma } from '@/lib/prisma';
import ListingCard from '@/components/ListingCard';

const CATEGORIES = ['Electronics', 'Fashion', 'Vehicles', 'Furniture', 'Services', 'Agriculture', 'Real Estate', 'Other'];
const COUNTRIES = [
  { code: 'GH', label: '🇬🇭 Ghana' },
  { code: 'NG', label: '🇳🇬 Nigeria' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'US', label: '🇺🇸 United States' },
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
      sort === 'price_asc'  ? { price: 'asc' }    :
      sort === 'price_desc' ? { price: 'desc' }   :
      sort === 'popular'    ? { views: 'desc' }   :
      { createdAt: 'desc' },
    include: {
      seller: { select: { firstName: true, lastName: true, averageRating: true } },
    },
    take: 48,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4332] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white mb-6">Marketplace</h1>
          <form method="GET" className="flex flex-wrap gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search listings…"
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:bg-white/20"
            />
            <select
              name="category"
              defaultValue={category ?? ''}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] [&>option]:text-gray-900"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              name="country"
              defaultValue={country ?? ''}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] [&>option]:text-gray-900"
            >
              <option value="">All Countries</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <select
              name="sort"
              defaultValue={sort ?? ''}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] [&>option]:text-gray-900"
            >
              <option value="">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <button
              type="submit"
              className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-sm text-gray-500 mb-6">
          {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
          {q && <> matching <span className="font-semibold text-gray-700">&ldquo;{q}&rdquo;</span></>}
        </p>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-gray-900">No listings found</h3>
            <p className="text-gray-500 mt-2">Try different search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
