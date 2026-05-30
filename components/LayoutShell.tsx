'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { CartProvider } from '@/context/CartContext';

const PWA_PREFIXES = ['/dashboard', '/escrow', '/wallet', '/history', '/profile', '/login', '/register', '/send'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPwa = PWA_PREFIXES.some(p => pathname.startsWith(p));

  if (isPwa) {
    return <main className="flex-1 bg-[#F4F6F8]">{children}</main>;
  }

  return (
    <CartProvider>
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
