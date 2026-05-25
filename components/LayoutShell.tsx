'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

const PWA_PREFIXES = ['/dashboard', '/escrow', '/wallet', '/history', '/profile', '/login', '/register'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPwa = PWA_PREFIXES.some(p => pathname.startsWith(p));

  if (isPwa) {
    return <main className="min-h-screen bg-[#F4F6F8]">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
