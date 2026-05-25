'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard',     label: 'Home',        icon: HomeIcon },
  { href: '/marketplace',   label: 'Market',      icon: MarketIcon },
  { href: '/escrow/create', label: 'Escrow',      icon: EscrowIcon },
  { href: '/wallet',        label: 'Wallet',      icon: WalletIcon },
  { href: '/profile',       label: 'Profile',     icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              active ? 'text-[#1B4332]' : 'text-gray-400'
            }`}
          >
            <Icon active={active} />
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? '#1B4332' : 'none'} stroke={active ? '#1B4332' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function MarketIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? '#1B4332' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function EscrowIcon({ active }: { active: boolean }) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${active ? 'bg-[#1B4332]' : 'bg-[#F5A623]'}`}>
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </div>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke={active ? '#1B4332' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? '#1B4332' : 'none'} stroke={active ? '#1B4332' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
