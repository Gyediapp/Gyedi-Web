'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-[#1B4332] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-[#F5A623] font-black text-xl tracking-tight">Gyedi</span>
            <span className="text-white/50 text-xs font-medium hidden sm:block border-l border-white/20 pl-2.5">Secure Marketplace</span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <Link href="/marketplace" className="text-white/75 hover:text-white text-sm font-medium transition-colors">Marketplace</Link>
            <Link href="/#how-it-works" className="text-white/75 hover:text-white text-sm font-medium transition-colors">How It Works</Link>
            <Link href="/#pricing" className="text-white/75 hover:text-white text-sm font-medium transition-colors">Pricing</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-white/75 hover:text-white text-sm font-medium transition-colors px-3 py-1.5">
              Log In
            </Link>
            <Link
              href="/sell"
              className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-bold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Start Selling
            </Link>
          </div>

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
            <Link href="/marketplace" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors">Marketplace</Link>
            <Link href="/#how-it-works" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors">How It Works</Link>
            <Link href="/#pricing" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors">Pricing</Link>
            <Link href="/sell" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors">Sell</Link>
            <div className="pt-2 border-t border-white/10 mt-2">
              <Link href="/login" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors">Log In</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
