'use client';

import { useState } from 'react';
import ShareModal from '@/components/ShareModal';

interface Props {
  listingId: string;
  title:     string;
}

export default function ListingShareButton({ listingId, title }: Props) {
  const [showShare, setShowShare] = useState(false);

  function getUrl() {
    return typeof window !== 'undefined'
      ? window.location.href
      : `https://gyedi.com/listing/${listingId}`;
  }

  return (
    <>
      <button
        onClick={() => setShowShare(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      {showShare && (
        <ShareModal
          url={getUrl()}
          title={title}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
