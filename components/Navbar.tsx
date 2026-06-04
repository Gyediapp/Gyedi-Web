'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

type NavUser = { firstName: string; lastName: string };

export default function Navbar() {
  const [open,      setOpen]      = useState(false);
  const [search,    setSearch]    = useState('');
  const [navUser,   setNavUser]   = useState<NavUser | null>(null);
  const [hydrated,  setHydrated]  = useState(false);
  const { totalItems } = useCart();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (token) {
      try {
        const stored = localStorage.getItem('gyedi_user');
        if (stored) setNavUser(JSON.parse(stored) as NavUser);
        else setNavUser({ firstName: 'Me', lastName: '' });
      } catch {
        setNavUser({ firstName: 'Me', lastName: '' });
      }
    }
    setHydrated(true);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      searchRef.current?.blur();
    }
  }

  const NAV_LINKS = [
    { label: 'Marketplace',  href: '/marketplace' },
    { label: 'Community',    href: '/community' },
    { label: 'Guide & FAQ',  href: '/guide' },
    { label: 'Pricing',      href: '/pricing' },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-lg">

      {/* ── TIER 1: Brand + Search + Actions ── */}
      <div className="bg-[#1B4332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[#F5A623] font-black text-xl tracking-tight">Gyedi</span>
              <span className="text-white/40 text-[11px] font-medium hidden sm:block border-l border-white/15 pl-2">
                Secure Marketplace
              </span>
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4">
              <div className="relative w-full">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search phones, clothes, cars..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 transition-all"
                />
                {search && (
                  <button type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F5A623] text-[#1B4332] text-xs font-black px-3 py-1.5 rounded-lg hover:bg-[#D4881A] transition-colors">
                    Search
                  </button>
                )}
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Favourites */}
              <Link href="/favourites" className="p-2 text-white/60 hover:text-white transition-colors" title="Saved">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-white/60 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#1B4332] text-[10px] font-black rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* User / Login — desktop only */}
              {hydrated && (
                <div className="hidden md:flex items-center gap-2 ml-1">
                  {navUser ? (
                    <>
                      <Link href="/my-store" className="text-white/70 hover:text-white text-sm font-medium transition-colors px-2">
                        My Store
                      </Link>
                      <Link href="/profile" className="flex items-center gap-2 text-white/85 hover:text-white transition-colors">
                        <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center text-[#1B4332] text-xs font-black">
                          {navUser.firstName[0]?.toUpperCase()}{navUser.lastName[0]?.toUpperCase()}
                        </div>
                      </Link>
                    </>
                  ) : (
                    <Link href="/login" className="text-white/70 hover:text-white text-sm font-medium px-3 py-1.5 transition-colors">
                      Log In
                    </Link>
                  )}
                </div>
              )}

              {/* Sell button — desktop */}
              <Link href="/sell" className="hidden md:block bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black text-sm px-4 py-2 rounded-xl transition-colors ml-1">
                + Sell
              </Link>

              {/* Hamburger — mobile */}
              <button onClick={() => setOpen(!open)}
                className="md:hidden p-2 text-white/70 hover:text-white transition-colors ml-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {open
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER 2: Navigation links — desktop only ── */}
      <div className="hidden md:block bg-[#154028] border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 h-10">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                className="px-4 py-1.5 text-white/65 hover:text-white hover:bg-white/8 rounded-lg text-sm font-medium transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href="/referrals"
              className="px-4 py-1.5 text-[#F5A623] hover:text-[#F5A623]/80 hover:bg-white/8 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
              🎁 Refer &amp; Earn
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile search bar ── */}
      <div className="md:hidden bg-[#154028] px-3 py-2 border-t border-white/8">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
            />
          </div>
        </form>
      </div>

      {/* ── Mobile hamburger menu ── */}
      {open && (
        <div className="md:hidden bg-[#1B4332] border-t border-white/10 py-3 space-y-0.5 px-3">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/referrals" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-[#F5A623] font-bold hover:bg-white/10 rounded-xl text-sm transition-colors">
            🎁 Refer &amp; Earn
          </Link>
          <Link href="/sell" onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center bg-[#F5A623] text-[#1B4332] font-black rounded-xl text-sm transition-colors mt-2">
            + Sell an Item
          </Link>
          <div className="pt-2 border-t border-white/10 mt-2">
            {hydrated && (navUser ? (
              <div className="space-y-0.5">
                <Link href="/my-store" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors">
                  <span className="text-lg">🏪</span>
                  <span className="text-sm font-semibold">My Store</span>
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center text-[#1B4332] text-xs font-black flex-shrink-0">
                    {navUser.firstName[0]?.toUpperCase()}{navUser.lastName[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold">{navUser.firstName} {navUser.lastName}</span>
                </Link>
              </div>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}
                className="block w-full text-center bg-white/10 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                Log In
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
