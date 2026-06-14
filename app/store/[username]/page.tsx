import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ReviewsSection from '@/components/ReviewsSection';
import StoreRatings from '@/components/StoreRatings';
import StoreProductCarousel from '@/components/StoreProductCarousel';
import StoreActions from './StoreActions';
import StoreOwnerBar from './StoreOwnerBar';
import FollowerCount from './FollowerCount';

const COUNTRY_FLAG: Record<string, string> = {
  GH: '🇬🇭', NG: '🇳🇬', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', US: '🇺🇸', SN: '🇸🇳', CI: '🇨🇮',
};

type ThemeKey = 'Minimal' | 'Bold' | 'Warm' | 'Professional';

const THEME: Record<ThemeKey, {
  banner:        string;
  bannerImg:     string;
  pageBg:        string;
  avatarBg:      string;
  avatarText:    string;
  avatarRing:    string;
  accentColor:   string;
  sectionBorder: string;
  dark:          boolean;
}> = {
  Minimal: {
    banner:        'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200',
    bannerImg:     'opacity-25 mix-blend-multiply',
    pageBg:        'bg-white',
    avatarBg:      'bg-[#1B4332]',
    avatarText:    'text-white',
    avatarRing:    'ring-white',
    accentColor:   '#1B4332',
    sectionBorder: 'border-gray-100',
    dark:           false,
  },
  Bold: {
    banner:        'bg-gradient-to-br from-[#1B4332] via-[#154028] to-[#081910]',
    bannerImg:     'opacity-20 mix-blend-luminosity',
    pageBg:        'bg-gray-50',
    avatarBg:      'bg-[#F5A623]',
    avatarText:    'text-[#1B4332]',
    avatarRing:    'ring-gray-50',
    accentColor:   '#1B4332',
    sectionBorder: 'border-gray-100',
    dark:           true,
  },
  Warm: {
    banner:        'bg-gradient-to-br from-amber-600 via-orange-700 to-orange-900',
    bannerImg:     'opacity-20 mix-blend-luminosity',
    pageBg:        'bg-[#FFFBF0]',
    avatarBg:      'bg-amber-50',
    avatarText:    'text-orange-900',
    avatarRing:    'ring-[#FFFBF0]',
    accentColor:   '#B45309',
    sectionBorder: 'border-amber-100',
    dark:           true,
  },
  Professional: {
    banner:        'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900',
    bannerImg:     'opacity-15 mix-blend-luminosity',
    pageBg:        'bg-slate-50',
    avatarBg:      'bg-white',
    avatarText:    'text-slate-800',
    avatarRing:    'ring-slate-50',
    accentColor:   '#334155',
    sectionBorder: 'border-slate-100',
    dark:           true,
  },
};

const TIER: Record<string, { cls: string; label: string }> = {
  BASIC:      { cls: 'bg-gray-100 text-gray-600',                                       label: 'Basic Store' },
  PRO:        { cls: 'bg-[#F5A623]/20 text-[#92580A] border border-[#F5A623]/40',        label: '★ Pro Seller' },
  BUSINESS:   { cls: 'bg-[#1B4332] text-white',                                          label: '✦ Business' },
  ENTERPRISE: { cls: 'bg-purple-600 text-white',                                          label: '◆ Enterprise' },
};

function getLinkStyle(label: string, url: string) {
  const combined = (label + ' ' + url).toLowerCase();
  if (combined.includes('whatsapp') || combined.includes('wa.me'))
    return { icon: '💬', cls: 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' };
  if (combined.includes('instagram'))
    return { icon: '📸', cls: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100' };
  if (combined.includes('facebook') || combined.includes('fb.com'))
    return { icon: '👥', cls: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' };
  if (combined.includes('tiktok'))
    return { icon: '🎵', cls: 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800' };
  if (combined.includes('twitter') || combined.includes('x.com'))
    return { icon: '✕', cls: 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800' };
  if (combined.includes('youtube'))
    return { icon: '▶', cls: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' };
  if (combined.includes('linkedin'))
    return { icon: 'in', cls: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' };
  return { icon: '🔗', cls: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' };
}

function fmtLastSeen(d: Date | null): string {
  if (!d) return 'Offline';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 2)  return 'Just now';
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Active ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `Active ${days}d ago`;
  return 'Offline';
}

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
          id: true, title: true, price: true, images: true,
          category: true, condition: true,
        },
      },
    },
  });

  if (!seller || seller.storeActive === false) notFound();

  const themeKey = ((seller.storeTheme as string) in THEME
    ? seller.storeTheme as ThemeKey
    : 'Bold');
  const t        = THEME[themeKey];
  const tier     = TIER[seller.storeType as string] ?? TIER.BASIC;
  const name     = (seller.storeName as string | null) || `${seller.firstName} ${seller.lastName}`;
  const links    = Array.isArray(seller.storeLinks)
    ? seller.storeLinks as { label: string; url: string }[]
    : [];
  const initials  = `${(seller.firstName as string)[0]}${(seller.lastName as string)[0]}`.toUpperCase();
  const isOnline  = seller.isOnline as boolean;
  const lastSeen  = seller.lastSeen as Date | null;
  const listings  = seller.listings as any[];
  const rating    = seller.averageRating
    ? parseFloat((seller.averageRating as any).toString())
    : null;
  const flag      = COUNTRY_FLAG[seller.country as string] ?? '🌍';

  return (
    <div className={`min-h-screen ${t.pageBg}`}>
      {/* Owner toolbar — only renders if viewing your own store */}
      <StoreOwnerBar sellerId={seller.id as string} />

      {/* ──────────────── BANNER ──────────────── */}
      <div className={`relative overflow-hidden h-56 sm:h-72 ${t.banner}`}>
        {seller.storeBanner && (
          <img
            src={seller.storeBanner as string}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover ${t.bannerImg}`}
          />
        )}
        {/* Minimal theme dot-grid pattern */}
        {themeKey === 'Minimal' && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #9ca3af 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        )}
        {/* Bottom fade so avatar ring blends cleanly */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>

      {/* ──────────────── PROFILE ──────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Avatar row — negative margin lifts avatar into banner */}
        <div className="flex items-end justify-between -mt-12 sm:-mt-16 mb-4 sm:mb-5">

          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            <div className={`
              w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl
              ${t.avatarBg} ${t.avatarText}
              flex items-center justify-center font-black text-2xl sm:text-4xl
              ring-4 ${t.avatarRing} shadow-2xl
            `}>
              {initials}
            </div>
            <span className={`
              absolute -bottom-1.5 -right-1.5
              w-5 h-5 sm:w-6 sm:h-6 rounded-full
              border-[3px] border-white shadow-md
              ${isOnline ? 'bg-green-400' : 'bg-gray-400'}
            `} />
          </div>

          {/* Desktop actions aligned to bottom-right of avatar row */}
          <div className="hidden sm:block pb-1">
            <StoreActions sellerId={seller.id as string} storeName={name} />
          </div>
        </div>

        {/* ── Store meta ── */}
        <div className="mb-8">

          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{name}</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${tier.cls}`}>
              {tier.label}
            </span>
            {(seller.kycStatus as string) === 'VERIFIED' && (
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                KYC Verified
              </span>
            )}
          </div>

          {/* Online status + country */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-5">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              {isOnline ? 'Online now' : fmtLastSeen(lastSeen)}
            </span>
            <span className="text-gray-300 select-none">·</span>
            <span>{flag} {seller.country as string}</span>
          </div>

          {/* ── Stats row ── */}
          <div className={`flex items-center gap-8 sm:gap-12 mb-6 pb-6 border-b ${t.sectionBorder}`}>
            <div className="text-center">
              <FollowerCount sellerId={seller.id as string} />
              <p className="text-xs text-gray-500 font-medium mt-0.5">Followers</p>
            </div>
            {rating !== null && (
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-black text-amber-500">
                  ★ {rating.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {seller.totalRatings as number} Review{(seller.totalRatings as number) !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-black text-gray-900">{listings.length}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Listing{listings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Bio */}
          {seller.storeBio && (
            <p className="text-gray-600 leading-relaxed max-w-2xl text-sm sm:text-base mb-5">
              {seller.storeBio as string}
            </p>
          )}

          {/* Social link pills */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {links.map((link, i) => {
                const style = getLinkStyle(link.label, link.url);
                return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${style.cls}`}
                  >
                    <span>{style.icon}</span>
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Mobile actions */}
          <div className="flex sm:hidden">
            <StoreActions sellerId={seller.id as string} storeName={name} />
          </div>
        </div>

        {/* ──────────────── LISTINGS CAROUSEL ──────────────── */}
        <div className={`border-t ${t.sectionBorder} pt-8 mb-10`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Shop Products
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {listings.length} listing{listings.length !== 1 ? 's' : ''}
                {listings.length > 0 && <span className="ml-1 hidden sm:inline">· swipe or use arrows to browse</span>}
              </p>
            </div>
          </div>
          <StoreProductCarousel
            listings={listings.map(l => ({
              id:        l.id,
              title:     l.title,
              price:     l.price.toString(),
              images:    l.images,
              category:  l.category,
              condition: l.condition,
            }))}
            sellerRating={rating}
          />
        </div>

        {/* ──────────────── TRANSACTION RATINGS ──────────────── */}
        <div className={`border-t ${t.sectionBorder} pt-8 mb-10`}>
          <StoreRatings userId={seller.id as string} />
        </div>

        {/* ──────────────── REVIEWS ──────────────── */}
        <div className={`border-t ${t.sectionBorder} pt-8 mb-10`}>
          <ReviewsSection sellerId={seller.id as string} sellerName={name} />
        </div>

        {/* ──────────────── CTA ──────────────── */}
        <div className="pb-16">
          <Link
            href="/marketplace"
            className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all group"
          >
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
    </div>
  );
}
