'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import { CartProvider } from '@/context/CartContext';

// Routes rendered in app-shell mode (no public navbar/footer)
const APP_PREFIXES = [
  '/dashboard', '/escrow', '/wallet', '/history',
  '/profile', '/login', '/register', '/send',
  '/notifications', '/verify',
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = APP_PREFIXES.some(p => pathname.startsWith(p));

  const [splash, setSplash] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fading at 200ms, remove from DOM at 350ms (150ms transition)
    const fadeTimer = setTimeout(() => setFading(true),  200);
    const hideTimer = setTimeout(() => setSplash(false), 350);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  const shell = isApp ? (
    <>
      <main className="flex-1 bg-[#F4F6F8] pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  ) : (
    <CartProvider>
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
      </div>
      <BottomNav />
    </CartProvider>
  );

  return (
    <>
      {splash && (
        <div
          className={`fixed inset-0 z-[9999] bg-[#1B4332] flex flex-col items-center justify-center transition-opacity duration-150 pointer-events-none ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="text-[#F5A623] font-black text-[96px] leading-none select-none">G</span>
          <div className="mt-6 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      {shell}
    </>
  );
}
