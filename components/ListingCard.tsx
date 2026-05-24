import Link from 'next/link';

interface ListingCardProps {
  id: string;
  title: string;
  price: string | number;
  images: string[];
  category: string;
  country: string;
  storeType: string;
  views: number;
  sellerName: string;
  sellerRating?: number | null;
}

const COUNTRY_FLAG: Record<string, string> = {
  GH: '🇬🇭', NG: '🇳🇬', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', US: '🇺🇸', SN: '🇸🇳', CI: '🇨🇮',
};

export default function ListingCard({
  id, title, price, images, category, country,
  storeType, views, sellerName, sellerRating,
}: ListingCardProps) {
  const thumb = images[0] ?? null;

  return (
    <Link
      href={`/listing/${id}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {storeType !== 'BASIC' && (
          <span className={`absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
            storeType === 'BUSINESS'
              ? 'bg-[#1B4332] text-white'
              : 'bg-[#F5A623] text-[#1B4332]'
          }`}>
            {storeType === 'BUSINESS' ? '✦ Business' : '★ Pro'}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-400 font-medium mb-1.5">
          {category} · {COUNTRY_FLAG[country] ?? '🌍'}
        </p>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#1B4332] transition-colors">
          {title}
        </h3>
        <p className="text-[#1B4332] font-black text-base mt-2">
          GHS {parseFloat(price.toString()).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{sellerName}</span>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {sellerRating && <span>⭐ {parseFloat(sellerRating.toString()).toFixed(1)}</span>}
            <span>{views} {views === 1 ? 'view' : 'views'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
