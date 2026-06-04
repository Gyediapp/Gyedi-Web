'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  function active(paths: string[], exact?: boolean) {
    if (exact) return paths.includes(pathname);
    return paths.some(p => pathname === p || pathname.startsWith(p + '/'));
  }

  const homeActive      = pathname === '/';
  const marketActive    = active(['/marketplace', '/listing', '/store', '/favourites', '/cart']);
  const sellActive      = active(['/sell', '/my-listings']);
  const communityActive = active(['/community', '/blog']);
  const profileActive = active(['/profile', '/my-store', '/dashboard', '/wallet', '/history', '/escrow', '/send', '/notifications', '/verify', '/referrals', '/login', '/register']);

  const clr = (on: boolean) => on ? 'text-[#F5A623]' : 'text-white/50';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#1B4332] border-t border-white/10 flex safe-area-bottom">
      {/* Home */}
      <Link href="/" className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-h-[56px] ${clr(homeActive)}`}>
        <svg className="w-5 h-5" fill={homeActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[10px] font-semibold">Home</span>
      </Link>

      {/* Marketplace */}
      <Link href="/marketplace" className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-h-[56px] ${clr(marketActive)}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span className="text-[10px] font-semibold">Market</span>
      </Link>

      {/* Sell — centre FAB */}
      <Link href="/sell" className="flex-1 flex flex-col items-center py-1 gap-0.5 min-h-[56px]">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center -mt-5 shadow-lg transition-colors ${
          sellActive ? 'bg-[#F5A623] ring-4 ring-[#F5A623]/30' : 'bg-[#F5A623]/90'
        }`}>
          <svg className="w-5 h-5 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className={`text-[10px] font-semibold ${clr(sellActive)}`}>Sell</span>
      </Link>

      {/* Community */}
      <Link href="/my-store" className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-h-[56px] ${clr(active(['/my-store', '/my-listings', '/wallet', '/history', '/watermark']))}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-[10px] font-semibold">My Store</span>
      </Link>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[10px] font-semibold">Community</span>
      </Link>

      {/* Profile */}
      <Link href="/profile" className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-h-[56px] ${clr(profileActive)}`}>
        <svg className="w-5 h-5" fill={profileActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-[10px] font-semibold">Profile</span>
      </Link>
    </nav>
  );
}
