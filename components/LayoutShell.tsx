'use client';

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

  if (isApp) {
    return (
      <>
        <main className="flex-1 bg-[#F4F6F8] pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <CartProvider>
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
      </div>
      <BottomNav />
    </CartProvider>
  );
}
