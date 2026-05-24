import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ListingCard from '@/components/ListingCard';

const COUNTRY_FLAG: Record<string, string> = {
  GH: '🇬🇭', NG: '🇳🇬', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', US: '🇺🇸', SN: '🇸🇳', CI: '🇨🇮',
};

const STORE_COLORS: Record<string, { banner: string; badge: string; badgeText: string }> = {
  BASIC:    { banner: 'from-gray-700 to-gray-900', badge: 'bg-gray-100 text-gray-600', badgeText: 'Basic' },
  PRO:      { banner: 'from-[#1B4332] to-[#0F2B1F]', badge: 'bg-[#F5A623]/20 text-[#F5A623]', badgeText: '★ Pro Seller' },
  BUSINESS: { banner: 'from-[#0F2B1F] via-[#1B4332] to-[#0F2B1F]', badge: 'bg-[#1B4332] text-white', badgeText: '✦ Business' },
};

export default async function StorePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const seller = await prisma.user.findUnique({
    where: { id: username },
    include: {
      listings: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!seller) notFound();

  const topStoreType = seller.listings.reduce<string>((top: string, l: { storeType: string }) => {
    const rank = { BASIC: 0, PRO: 1, BUSINESS: 2 };
    return (rank[l.storeType as keyof typeof rank] ?? 0) > (rank[top as keyof typeof rank] ?? 0) ? l.storeType : top;
  }, 'BASIC');

  const style = STORE_COLORS[topStoreType] ?? STORE_COLORS.BASIC;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className={`bg-gradient-to-r ${style.banner} py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-white font-black text-2xl shrink-0">
              {seller.firstName[0]}{seller.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-white">
                  {seller.firstName} {seller.lastName}
                </h1>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
                  {style.badgeText}
                </span>
                {seller.kycStatus === 'VERIFIED' && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-300">
                    ✓ KYC Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-white/60 text-sm">
                <span>{COUNTRY_FLAG[seller.country] ?? '🌍'} {seller.country}</span>
                {seller.averageRating && (
                  <span>⭐ {parseFloat(seller.averageRating.toString()).toFixed(1)} ({seller.totalRatings} ratings)</span>
                )}
                <span>{seller.listings.length} active {seller.listings.length === 1 ? 'listing' : 'listings'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {seller.listings.length > 0 ? (
          <>
            <h2 className="text-xl font-black text-gray-900 mb-6">
              All Listings <span className="text-gray-400 font-normal text-base">({seller.listings.length})</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {seller.listings.map((l: any) => (
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
                  sellerName={`${seller.firstName} ${seller.lastName}`}
                  sellerRating={seller.averageRating ? parseFloat(seller.averageRating.toString()) : null}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-4">📦</p>
            <h3 className="text-xl font-bold text-gray-900">No active listings</h3>
            <p className="text-gray-500 mt-2">This seller hasn&apos;t listed anything yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
