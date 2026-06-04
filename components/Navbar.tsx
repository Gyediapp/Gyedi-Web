'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

type NavUser = { firstName: string; lastName: string };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  const [navUser, setNavUser] = useState<NavUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (token) {
      try {
        const stored = localStorage.getItem('gyedi_user');
        if (stored) {
          const u = JSON.parse(stored) as NavUser;
          setNavUser(u);
        } else {
          setNavUser({ firstName: 'Me', lastName: '' });
        }
      } catch {
        setNavUser({ firstName: 'Me', lastName: '' });
      }
    }
    setHydrated(true);
  }, []);

  return (
    <nav className="bg-[#1B4332] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-[#F5A623] font-black text-xl tracking-tight">Gyedi</span>
            <span className="text-white/50 text-xs font-medium hidden sm:block border-l border-white/20 pl-2.5">Secure Marketplace</span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <Link href="/marketplace" className="text-white/75 hover:text-white text-base font-medium transition-colors">Marketplace</Link>
            <Link href="/#how-it-works" className="text-white/75 hover:text-white text-base font-medium transition-colors">How It Works</Link>
            <Link href="/guide" className="text-white/75 hover:text-white text-base font-medium transition-colors">How It Works</Link>
            <Link href="/pricing" className="text-white/75 hover:text-white text-base font-medium transition-colors">Pricing</Link>
            <Link href="/referrals" className="flex items-center gap-1 text-[#F5A623] hover:text-[#F5A623]/80 text-base font-bold transition-colors">
              <span>🎁</span> Refer &amp; Earn
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Saved / Favourites icon */}
            <Link href="/favourites" className="p-2 text-white/75 hover:text-white transition-colors" title="Saved items">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </Link>

            {/* Cart icon */}
            <Link href="/cart" className="relative p-2 text-white/75 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#1B4332] text-[10px] font-black rounded-full flex items-center justify-center leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {hydrated && (navUser ? (
              <>
                <Link href="/my-store" className="text-white/75 hover:text-white text-base font-medium transition-colors">
                  My Store
                </Link>

                <Link href="/profile" className="flex items-center gap-2 text-white/85 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center text-[#1B4332] text-xs font-black">
                    {navUser.firstName[0]?.toUpperCase()}{navUser.lastName[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold max-w-[100px] truncate">{navUser.firstName}</span>
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-white/75 hover:text-white text-base font-medium transition-colors px-4 py-2">
                Log In
              </Link>
            ))}

            <Link
              href="/sell"
              className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-bold text-base px-6 py-2.5 rounded-xl transition-colors"
            >
              Start Selling
            </Link>
          </div>

          {/* Mobile saved icon */}
          <Link href="/favourites" className="md:hidden p-2 text-white/75 hover:text-white transition-colors" title="Saved items">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </Link>

          {/* Mobile cart icon */}
          <Link href="/cart" className="md:hidden relative p-2 text-white/75 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5A623] text-[#1B4332] text-[10px] font-black rounded-full flex items-center justify-center leading-none">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden py-4 space-y-1 border-t border-white/10">
            <Link href="/marketplace" onClick={() => setOpen(false)} className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base font-medium transition-colors">Marketplace</Link>
            <Link href="/#how-it-works" onClick={() => setOpen(false)} className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base font-medium transition-colors">How It Works</Link>
            <Link href="/guide" onClick={() => setOpen(false)} className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base font-medium transition-colors">How It Works</Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base font-medium transition-colors">Pricing</Link>
            <Link href="/sell" onClick={() => setOpen(false)} className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base font-medium transition-colors">Sell an Item</Link>
            {hydrated && navUser && (
              <Link href="/my-store" onClick={() => setOpen(false)} className="block px-4 py-3 text-[#F5A623] hover:text-white hover:bg-white/10 rounded-xl text-base font-bold transition-colors">🏪 My Store</Link>
            )}
            <Link href="/favourites" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base font-medium transition-colors">
              <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved Items
            </Link>
            <Link href="/referrals" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-[#F5A623] font-bold hover:bg-white/10 rounded-xl text-base transition-colors">
              🎁 Refer &amp; Earn
            </Link>
            <div className="pt-3 border-t border-white/10 mt-2 px-2">
              {hydrated && (navUser ? (
                <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center text-[#1B4332] text-xs font-black flex-shrink-0">
                    {navUser.firstName[0]?.toUpperCase()}{navUser.lastName[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold">{navUser.firstName} {navUser.lastName}</span>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="block w-full text-center bg-[#F5A623] text-[#1B4332] font-bold py-3 rounded-xl text-base transition-colors">
                  Log In
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
