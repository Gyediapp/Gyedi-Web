import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import LayoutShell from '@/components/LayoutShell';
import SiteBanner from '@/components/SiteBanner';
import { getSiteSettings } from '@/lib/site-settings';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {

  title: {
    default: 'Gyedi — Secure Escrow Marketplace Ghana',
    template: '%s | Gyedi',
  },
  description: "Ghana's trusted escrow marketplace. Buy and sell safely with escrow protection on every deal. MTN MoMo payments, KYC verified sellers.",
  keywords: ['escrow', 'marketplace', 'Ghana', 'buy sell', 'MoMo', 'safe trading', 'Accra', 'Kumasi','Koforidua','Takoradi','Cape Coast','online shopping Ghana','trusted marketplace','Gyedi'],
  authors: [{ name: 'Gyedi Technologies' }],
  creator: 'Gyedi Technologies',
  publisher: 'Gyedi Technologies',
  metadataBase: new URL('https://gyedi.app'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://gyedi.app',
    siteName: 'Gyedi',
    title: 'Gyedi — Secure Escrow Marketplace Ghana',
    description: "Ghana's trusted escrow marketplace. Buy and sell safely with escrow protection on every deal.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Gyedi Secure Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gyedi — Secure Escrow Marketplace Ghana',
    description: "Ghana's trusted escrow marketplace.",
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gyedi',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: 'I_0o4wGr1bUDMjKWNX52VQ7o0fiQndspQEIhPf7RBPw',
  },

  

};

export const viewport: Viewport = {
  themeColor: '#1B4332',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { maintenance, banner } = await getSiteSettings();

  if (maintenance.enabled) {
    return (
      <html lang="en" className={geist.variable}>
        <head><link rel="apple-touch-icon" href="/icon-192.png" /></head>
        <body className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
              <div className="text-6xl mb-6">🔧</div>
              <h1 className="text-2xl font-black text-[#1B4332] mb-2">Under Maintenance</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {maintenance.message || 'We are performing scheduled maintenance. Please check back soon.'}
              </p>
              <span className="text-2xl font-black text-[#F5A623]">Gyedi</span>
              <p className="text-xs text-gray-400 mt-1">Secure Escrow Platform</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={geist.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 overflow-x-hidden">
        <SiteBanner banner={banner} />
        <LayoutShell>{children}</LayoutShell>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}</Script>
      </body>
    </html>
  );
}
