'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',   icon: '▦' },
  { href: '/escrow/create', label: 'New Escrow',   icon: '🔒' },
  { href: '/history',       label: 'History',      icon: '📋' },
  { href: '/my-listings',   label: 'My Listings',  icon: '🏪' },
  { href: '/sell',          label: 'Sell Item',    icon: '➕' },
  { href: '/wallet',        label: 'Wallet',       icon: '💰' },
  { href: '/referrals',     label: 'Referrals',    icon: '🎁' },
  { href: '/profile',       label: 'Profile',      icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="md:flex md:min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-[#1B4332] min-h-screen sticky top-0 self-start">
        <div className="px-5 py-6 border-b border-white/10">
          <Link href="/" className="text-[#F5A623] font-black text-xl tracking-tight">Gyedi</Link>
          <p className="text-green-400 text-xs mt-0.5">Your Account</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F5A623] text-[#1B4332] font-bold'
                    : 'text-green-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-base w-5 text-center">🛍️</span>
            Back to Marketplace
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 bg-[#F4F6F8]">
        {children}
      </div>
    </div>
  );
}
