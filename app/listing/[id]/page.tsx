import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BuyNowButton from '@/components/BuyNowButton';
import MessageSellerButton from '@/components/MessageSellerButton';
import LikeButton from '@/components/LikeButton';
import ListingShareButton from '@/components/ListingShareButton';
import FavouriteButton from '@/components/FavouriteButton';
import AddToCartButton from '@/components/AddToCartButton';
import QASection from '@/components/QASection';
import EditListingButton from '@/components/EditListingButton';
import ListingGallery from '@/components/ListingGallery';
import RecentlyViewedTracker from '@/components/RecentlyViewedTracker';
import ProductCarousel from '@/components/ProductCarousel';
import BoostButton from '@/components/BoostButton';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const listing = await (prisma as any).listing.findUnique({
    where: { id },
    select: { title: true, description: true, images: true, price: true },
  });
  if (!listing) return { title: 'Listing not found | Gyedi' };

  const price = parseFloat(listing.price.toString())
    .toLocaleString('en-GH', { minimumFractionDigits: 2 });
  const desc  = (listing.description as string | null)?.slice(0, 155) ?? `GHS ${price} — Buy safely on Gyedi`;
  const ogImg = (listing.images as string[])[0];

  return {
    title:       `${listing.title} — GHS ${price} | Gyedi`,
    description: desc,
    openGraph: {
      title:       listing.title,
      description: desc,
      type:        'website',
      images:      ogImg ? [{ url: ogImg, width: 1200, height: 630, alt: listing.title }] : [],
    },
    twitter: {
      card:        'summary_large_image',
      title:       listing.title,
      description: desc,
      images:      ogImg ? [ogImg] : [],
    },
  };
}

const COUNTRY_FLAG: Record<string, string> = {
  GH: '🇬🇭', NG: '🇳🇬', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', US: '🇺🇸', SN: '🇸🇳', CI: '🇨🇮',
};

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let listing: any = null;
  let fetchError: string | null = null;

  try {
    listing = await (prisma as any).listing.findUnique({
      where: { id },
      select: {
        id: true, title: true, description: true, price: true,
        category: true, images: true, country: true, status: true,
        storeType: true, views: true, condition: true,
        seller: {
          select: {
            id: true, firstName: true, lastName: true,
            averageRating: true, totalRatings: true,
            country: true, kycStatus: true,
            showPhone: true, showEmail: true, showWhatsapp: true,
            businessPhone: true, businessEmail: true,
            createdAt: true,
          },
        },
      },
    });
  } catch (e: any) {
    fetchError = e?.message ?? String(e);
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl w-full">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Listing unavailable</h1>
          <p className="text-gray-500 mb-4 text-sm">A database error occurred loading this listing:</p>
          <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-red-700 overflow-auto whitespace-pre-wrap break-all">
            {fetchError}
          </pre>
        </div>
      </div>
    );
  }

  if (!listing || listing.status !== 'ACTIVE') notFound();

  // Increment views (fire and forget)
  (prisma as any).listing.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  // Store siblings — for prev/next navigation within the seller's store
  let storeListings: { id: string; title: string }[] = [];
  try {
    storeListings = await (prisma as any).listing.findMany({
      where: { sellerId: listing.seller.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    });
  } catch {}
  const storeIdx   = storeListings.findIndex((l: any) => l.id === id);
  const prevListing = storeIdx > 0 ? storeListings[storeIdx - 1] : null;
  const nextListing = storeIdx < storeListings.length - 1 ? storeListings[storeIdx + 1] : null;

  // You Might Also Like — same category, excluding this listing
  const related = await (prisma as any).listing.findMany({
    where: { status: 'ACTIVE', category: listing.category, id: { not: id } },
    orderBy: { views: 'desc' },
    take: 8,
    select: {
      id: true, title: true, price: true, images: true,
      category: true, storeType: true, views: true,
      seller: { select: { id: true, firstName: true, lastName: true, averageRating: true } },
    },
  }).catch(() => []);

  const seller     = listing.seller;
  const sellerName = `${seller.firstName} ${seller.lastName}`;
  const memberSince = new Date(seller.createdAt).toLocaleDateString('en-GH', { month: 'short', year: 'numeric' });

  const toProduct = (l: any) => ({
    id: l.id, title: l.title, price: l.price.toString(),
    images: l.images, category: l.category, storeType: l.storeType,
    views: l.views,
    seller: {
      id: l.seller.id, firstName: l.seller.firstName, lastName: l.seller.lastName,
      averageRating: l.seller.averageRating ? l.seller.averageRating.toString() : null,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 pb-28">
      <RecentlyViewedTracker listingId={id} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Store navigation strip */}
        {storeListings.length > 1 && (
          <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-5 shadow-sm">
            <Link
              href={`/store/${listing.seller.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#1B4332] transition-colors min-w-0 truncate"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="truncate">
                {seller.firstName}&apos;s store
              </span>
            </Link>
            <div className="flex items-center gap-0.5 shrink-0 ml-3">
              {prevListing ? (
                <Link
                  href={`/listing/${prevListing.id}`}
                  title={prevListing.title}
                  className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-[#1B4332] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              ) : (
                <span className="p-2 text-gray-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></span>
              )}
              <span className="text-xs text-gray-400 font-medium px-1 tabular-nums">
                {storeIdx + 1}/{storeListings.length}
              </span>
              {nextListing ? (
                <Link
                  href={`/listing/${nextListing.id}`}
                  title={nextListing.title}
                  className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-[#1B4332] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <span className="p-2 text-gray-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></span>
              )}
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link href="/marketplace" className="hover:text-[#1B4332] font-medium transition-colors">Marketplace</Link>
          <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/marketplace?category=${encodeURIComponent(listing.category)}`} className="hover:text-[#1B4332] font-medium transition-colors">{listing.category}</Link>
          <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium truncate max-w-[200px] sm:max-w-xs">{listing.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            <ListingGallery images={listing.images as string[]} title={listing.title as string} />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{listing.category}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{COUNTRY_FLAG[listing.country] ?? '🌍'} {listing.country}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{listing.views} views</span>
                {listing.condition && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          listing.condition === 'New' ? 'bg-green-100 text-green-700' :
          listing.condition === 'Like New' ? 'bg-emerald-100 text-emerald-700' :
          listing.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
           listing.condition === 'Fair' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'                    }`}>
                      {listing.condition}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">{listing.title}</h1>
              <p className="text-4xl font-black text-[#1B4332] mt-4">
                GHS {parseFloat(listing.price.toString()).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <EditListingButton listingId={listing.id} sellerId={seller.id} />
                <BoostButton listingId={listing.id} sellerId={seller.id} />
                <LikeButton listingId={listing.id} />
                <FavouriteButton listingId={listing.id} />
                <AddToCartButton
                  listingId={listing.id}
                  title={listing.title}
                  price={parseFloat(listing.price.toString())}
                  image={listing.images[0] ?? null}
                  sellerId={seller.id}
                  sellerName={sellerName}
                  condition={listing.condition ?? undefined}
                />
                <ListingShareButton listingId={listing.id} title={listing.title} />
              </div>
            </div>

            {/* Buy CTA */}
            <div className="bg-[#1B4332] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#F5A623] text-lg">🔒</span>
                <span className="font-bold text-sm">Protected by Gyedi Escrow</span>
              </div>
              <p className="text-white/70 text-sm mb-5 leading-relaxed">
                Your payment is held safely until you confirm receipt. Funds release only when you&apos;re satisfied.
              </p>
              <BuyNowButton
                sellerId={seller.id}
                listingTitle={listing.title}
                amount={parseFloat(listing.price.toString())}
                description={listing.description ?? undefined}
                listingId={listing.id}
              />
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider">Seller</h2>

              {/* Seller identity */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1B4332] flex items-center justify-center text-white font-black text-lg shrink-0">
                  {seller.firstName[0]}{seller.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{sellerName}</span>
                    {seller.kycStatus === 'VERIFIED' && (
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">✓ Verified</span>
                    )}
                    {listing.storeType !== 'BASIC' && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        listing.storeType === 'BUSINESS' ? 'bg-[#1B4332] text-white' : 'bg-[#F5A623] text-[#1B4332]'
                      }`}>
                        {listing.storeType === 'BUSINESS' ? '✦ Business' : '★ Pro'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                    {seller.averageRating && (
                      <span>⭐ {parseFloat(seller.averageRating.toString()).toFixed(1)} ({seller.totalRatings})</span>
                    )}
                    <span>· {COUNTRY_FLAG[seller.country] ?? '🌍'} {seller.country}</span>
                    <span>· Member since {memberSince}</span>
                  </div>
                </div>
                <Link
                  href={`/store/${seller.id}`}
                  className="text-[#1B4332] text-sm font-semibold hover:underline shrink-0"
                >
                  View Store →
                </Link>
              </div>

              {/* Contact visibility */}
              <div className="pt-3 border-t border-gray-50 space-y-2">
                {(seller.showPhone && seller.businessPhone) && (
                  <a
                    href={`tel:${seller.businessPhone}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#1B4332] transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {seller.businessPhone}
                  </a>
                )}
                {(seller.showEmail && seller.businessEmail) && (
                  <a
                    href={`mailto:${seller.businessEmail}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#1B4332] transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {seller.businessEmail}
                  </a>
                )}
                {(seller.showWhatsapp && seller.businessPhone) && (
                  <a
                    href={`https://wa.me/${seller.businessPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                {!seller.showPhone && !seller.showEmail && !seller.showWhatsapp && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    🔒 Contact hidden — message via Gyedi
                  </p>
                )}

                <MessageSellerButton
                  sellerId={seller.id}
                  listingTitle={listing.title}
                  amount={parseFloat(listing.price.toString())}
                />
              </div>
            </div>

            {/* How escrow protects you */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <h3 className="font-black text-gray-900 text-sm mb-3">🛡️ How Escrow Protects You</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-green-600 font-bold shrink-0">✓</span> Money is held until you confirm you received the item</li>
                <li className="flex items-start gap-2"><span className="text-green-600 font-bold shrink-0">✓</span> Dispute resolution if something goes wrong</li>
                <li className="flex items-start gap-2"><span className="text-green-600 font-bold shrink-0">✓</span> Seller only gets paid when you&apos;re satisfied</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-10">
          <QASection listingId={listing.id} sellerId={listing.seller.id} />
        </div>

        {/* Browse Marketplace */}
        <Link href="/marketplace" className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow group mt-6">
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

      {/* ── YOU MIGHT ALSO LIKE ── */}
      {related.length > 0 && (
        <section className="py-10 md:py-14 bg-[#F4F6F8] mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-5 md:mb-8">
              <div>
                <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">More like this</p>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">You Might Also Like</h2>
              </div>
              <Link href={`/marketplace?category=${encodeURIComponent(listing.category)}`}
                className="text-[#1B4332] font-bold text-sm hover:underline flex-shrink-0 ml-4">
                See all in {listing.category} →
              </Link>
            </div>
            <ProductCarousel products={related.map(toProduct)} />
          </div>
        </section>
      )}
    </div>
  );
}
