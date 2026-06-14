'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const ACTIVE_STATUSES = new Set(['FUNDED', 'IN_TRANSIT']);

export default function BottomNav() {
  const pathname = usePathname();
  const [ordersCount, setOrdersCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function active(paths: string[], exact?: boolean) {
    if (exact) return paths.includes(pathname);
    return paths.some(p => pathname === p || pathname.startsWith(p + '/'));
  }

  const homeActive    = pathname === '/';
  const marketActive  = active(['/marketplace', '/listing', '/store', '/favourites', '/cart']);
  const sellActive    = active(['/sell', '/my-listings']);
  const ordersActive  = active(['/history']);
  const profileActive = active(['/profile', '/dashboard', '/send', '/notifications', '/verify', '/referrals', '/login', '/register', '/escrow', '/my-store', '/my-listings', '/wallet', '/watermark']);

  const clr = (on: boolean) => on ? 'text-[#F5A623]' : 'text-white/50';

  async function fetchOrdersCount() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/escrows?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: { status: string }[] = data.escrows ?? data.transactions ?? [];
      setOrdersCount(list.filter(e => ACTIVE_STATUSES.has(e.status)).length);
    } catch {}
  }

  useEffect(() => {
    fetchOrdersCount();
    intervalRef.current = setInterval(fetchOrdersCount, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Orders */}
      <Link href="/history" className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-h-[56px] ${clr(ordersActive)}`}>
        <div className="relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          {ordersCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none px-0.5">
              {ordersCount > 9 ? '9+' : ordersCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold">Orders</span>
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
