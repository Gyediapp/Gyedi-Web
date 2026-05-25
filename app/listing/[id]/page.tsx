import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BuyNowButton from '@/components/BuyNowButton';

const COUNTRY_FLAG: Record<string, string> = {
  GH: '🇬🇭', NG: '🇳🇬', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', US: '🇺🇸', SN: '🇸🇳', CI: '🇨🇮',
};

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { id: true, firstName: true, lastName: true, phone: true, averageRating: true, totalRatings: true, country: true, kycStatus: true } } },
  });

  if (!listing || listing.status !== 'ACTIVE') notFound();

  // Increment views (fire and forget)
  prisma.listing.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  const sellerName = `${listing.seller.firstName} ${listing.seller.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            {listing.images.length > 0 ? (
              <div className="space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {listing.images.slice(1, 5).map((img: string, i: number) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white border border-gray-100">
                        <img src={img} alt={`${listing.title} ${i + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-200">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{listing.category}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{COUNTRY_FLAG[listing.country] ?? '🌍'} {listing.country}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{listing.views} views</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">{listing.title}</h1>
              <p className="text-4xl font-black text-[#1B4332] mt-4">
                GHS {parseFloat(listing.price.toString()).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </p>
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
                sellerPhone={listing.seller.phone}
                listingTitle={listing.title}
                amount={parseFloat(listing.price.toString())}
              />
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4">Seller</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1B4332] flex items-center justify-center text-white font-black text-lg shrink-0">
                  {listing.seller.firstName[0]}{listing.seller.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{sellerName}</span>
                    {listing.seller.kycStatus === 'VERIFIED' && (
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
                  {listing.seller.averageRating && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      ⭐ {parseFloat(listing.seller.averageRating.toString()).toFixed(1)} · {listing.seller.totalRatings} ratings
                    </p>
                  )}
                </div>
                <Link
                  href={`/store/${listing.seller.id}`}
                  className="text-[#1B4332] text-sm font-semibold hover:underline shrink-0"
                >
                  View Store →
                </Link>
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
      </div>
    </div>
  );
}
