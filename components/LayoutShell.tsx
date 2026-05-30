'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { CartProvider } from '@/context/CartContext';

// Routes that use mobile-app style layout (no Navbar/Footer, mobile-first)
const PWA_PREFIXES = ['/dashboard', '/escrow', '/wallet', '/history', '/profile', '/login', '/register', '/send'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPwa = PWA_PREFIXES.some(p => pathname.startsWith(p));

  if (isPwa) {
    // Mobile-app pages: full-width on phone, centered at 480px on desktop
    return (
      <main className="flex-1 bg-[#F4F6F8]">
        <div className="w-full max-w-[480px] mx-auto min-h-screen">
          {children}
        </div>
      </main>
    );
  }

  // Public pages (marketplace, sell, listing, homepage, blog, etc.):
  // full-width on mobile, centered 768px on tablet, 1200px on desktop
  return (
    <CartProvider>
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 w-full md:max-w-3xl lg:max-w-[1200px] md:mx-auto">
          {children}
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
