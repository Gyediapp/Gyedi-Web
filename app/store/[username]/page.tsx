import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ListingCard from '@/components/ListingCard';
import FollowButton from '@/components/FollowButton';
import ReviewsSection from '@/components/ReviewsSection';

const COUNTRY_FLAG: Record<string, string> = {
  GH: '🇬🇭', NG: '🇳🇬', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', US: '🇺🇸', SN: '🇸🇳', CI: '🇨🇮',
};

const THEME: Record<string, {
  banner: string; bannerImg: string; text: string; sub: string; avatarBg: string; avatarText: string; dark: boolean;
}> = {
  Minimal: {
    banner:     'bg-gradient-to-br from-gray-100 to-gray-200',
    bannerImg:  'opacity-30 mix-blend-multiply',
    text:       'text-gray-900',
    sub:        'text-gray-500',
    avatarBg:   'bg-[#1B4332]',
    avatarText: 'text-white',
    dark:       false,
  },
  Bold: {
    banner:     'bg-gradient-to-br from-[#1B4332] to-[#0F2B1F]',
    bannerImg:  'opacity-20 mix-blend-luminosity',
    text:       'text-white',
    sub:        'text-white/60',
    avatarBg:   'bg-[#F5A623]',
    avatarText: 'text-[#1B4332]',
    dark:       true,
  },
  Warm: {
    banner:     'bg-gradient-to-br from-amber-700 to-orange-900',
    bannerImg:  'opacity-20 mix-blend-luminosity',
    text:       'text-white',
    sub:        'text-amber-200',
    avatarBg:   'bg-white/20',
    avatarText: 'text-white',
    dark:       true,
  },
  Professional: {
    banner:     'bg-gradient-to-br from-slate-700 to-slate-900',
    bannerImg:  'opacity-15 mix-blend-luminosity',
    text:       'text-white',
    sub:        'text-slate-300',
    avatarBg:   'bg-white/15',
    avatarText: 'text-white',
    dark:       true,
  },
};

const TIER: Record<string, { cls: string; label: string }> = {
  BASIC:      { cls: 'bg-gray-100 text-gray-600',          label: 'Basic Store' },
  PRO:        { cls: 'bg-[#F5A623]/20 text-[#B07316]',     label: '★ Pro Seller' },
  BUSINESS:   { cls: 'bg-[#1B4332] text-white',            label: '✦ Business' },
  ENTERPRISE: { cls: 'bg-purple-100 text-purple-700',      label: '◆ Enterprise' },
};

export default async function StorePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const seller = await (prisma as any).user.findUnique({
    where: { id: username },
    select: {
      id: true, firstName: true, lastName: true, country: true, kycStatus: true,
      averageRating: true, totalRatings: true,
      storeType: true, storeName: true, storeBanner: true, storeBio: true,
      storeTheme: true, storeLinks: true, storeActive: true,
      isOnline: true, lastSeen: true,
      listings: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, price: true, images: true, category: true,
          country: true, storeType: true, views: true, condition: true,
        },
      },
    },
  });

  if (!seller || seller.storeActive === false) notFound();

  const theme    = THEME[seller.storeTheme as string] ?? THEME.Bold;
  const tier     = TIER[seller.storeType as string]   ?? TIER.BASIC;
  const name     = (seller.storeName as string | null) || `${seller.firstName} ${seller.lastName}`;
  const links    = Array.isArray(seller.storeLinks) ? seller.storeLinks as { label: string; url: string }[] : [];
  const initials = `${seller.firstName[0]}${seller.lastName[0]}`;
  const isOnline = seller.isOnline as boolean;
  const lastSeen = seller.lastSeen as Date | null;

  function fmtLastSeen(d: Date | null) {
    if (!d) return 'Offline';
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `Active ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Active ${hrs}h ago`;
    return `Active ${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Banner ── */}
      <div className={`relative overflow-hidden ${theme.banner}`}>
        {seller.storeBanner && (
          <img
            src={seller.storeBanner as string}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover ${theme.bannerImg}`}
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ${theme.avatarBg} flex items-center justify-center font-black text-3xl ${theme.avatarText} shrink-0 shadow-xl`}>
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className={`text-3xl sm:text-4xl font-black ${theme.text} leading-tight`}>{name}</h1>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${tier.cls}`}>{tier.label}</span>
                {seller.kycStatus === 'VERIFIED' && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${theme.dark ? 'bg-green-500/25 text-green-300' : 'bg-green-100 text-green-700'}`}>
                    ✓ KYC Verified
                  </span>
                )}
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                  isOnline ? 'bg-green-500/20 text-green-300' : theme.dark ? 'bg-white/10 text-white/50' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                  {isOnline ? 'Online now' : fmtLastSeen(lastSeen)}
                </span>
              </div>

              {seller.storeBio && (
                <p className={`text-sm leading-relaxed max-w-xl mb-3 ${theme.sub}`}>{seller.storeBio as string}</p>
              )}

              <div className={`flex flex-wrap items-center gap-4 text-sm ${theme.sub}`}>
                <span>{COUNTRY_FLAG[seller.country as string] ?? '🌍'} {seller.country}</span>
                {seller.averageRating && (
                  <span>⭐ {parseFloat((seller.averageRating as any).toString()).toFixed(1)} ({seller.totalRatings} ratings)</span>
                )}
                <span>{(seller.listings as any[]).length} listing{(seller.listings as any[]).length !== 1 ? 's' : ''}</span>
              </div>

              {/* Social links + Follow */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-opacity hover:opacity-80 ${
                      theme.dark
                        ? 'border-white/30 text-white bg-white/10'
                        : 'border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    🔗 {link.label}
                  </a>
                ))}
                <FollowButton sellerId={seller.id as string} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Listings ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {(seller.listings as any[]).length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">
                All Listings
                <span className="text-gray-400 font-normal text-base ml-2">({(seller.listings as any[]).length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {(seller.listings as any[]).map(l => (
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
                  condition={l.condition}
                  sellerName={`${seller.firstName} ${seller.lastName}`}
                  sellerRating={seller.averageRating ? parseFloat((seller.averageRating as any).toString()) : null}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-6xl mb-4">📦</p>
            <h3 className="text-xl font-bold text-gray-900">No active listings</h3>
            <p className="text-gray-500 mt-2">This seller hasn&apos;t listed anything yet</p>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-10 pt-10 border-t border-gray-200">
          <ReviewsSection sellerId={seller.id as string} sellerName={name} />
        </div>

        <Link href="/marketplace" className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow group mt-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="font-bold text-gray-900 text-sm">Browse Marketplace</p>
              <p className="text-xs text-gray-400">Discover more listings</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-[#1B4332] transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
