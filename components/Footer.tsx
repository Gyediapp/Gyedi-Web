import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0F2B1F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-8 md:mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-[#F5A623] font-black text-2xl tracking-tight">Gyedi</span>
            <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-xs">
              Ghana&apos;s trusted escrow marketplace. Every deal is protected until you confirm you&apos;re happy.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs font-medium bg-[#F5A623]/20 text-[#F5A623] px-2.5 py-1 rounded-full">🔒 Escrow Protected</span>
              <span className="text-xs font-medium bg-white/10 text-white/60 px-2.5 py-1 rounded-full">🇬🇭 Made in Ghana</span>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wide">Marketplace</h3>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Browse Listings</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">Sell an Item</Link></li>
              <li><Link href="/marketplace?sort=popular" className="hover:text-white transition-colors">Trending Now</Link></li>
              <li><Link href="/marketplace?flash=1" className="hover:text-white transition-colors">Flash Deals</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wide">Learn</h3>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li><Link href="/guide" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/guide#buying" className="hover:text-white transition-colors">Buyer Guide</Link></li>
              <li><Link href="/guide#selling" className="hover:text-white transition-colors">Seller Guide</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Community Forum</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wide">Account</h3>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/my-store" className="hover:text-white transition-colors">My Store</Link></li>
              <li><Link href="/referrals" className="hover:text-white transition-colors">Refer & Earn</Link></li>
              <li><Link href="/watermark" className="hover:text-white transition-colors">Watermark Tool</Link></li>
            </ul>
          </div>

          {/* Download */}
          <div>
            <h3 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wide">Get the App</h3>
            <div className="space-y-3">
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-xl text-sm border border-white/10">
                <svg className="w-5 h-5 text-[#F5A623] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l15 8.5c.6.34.6 1.26 0 1.6l-15 8.5c-.66.5-1.6.03-1.6-.8z"/>
                </svg>
                <div>
                  <p className="text-white/50 text-xs leading-none mb-0.5">Get it on</p>
                  <p className="font-semibold text-white text-sm leading-none">Google Play</p>
                </div>
              </a>
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-xl text-sm border border-white/10">
                <svg className="w-5 h-5 text-[#F5A623] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="text-white/50 text-xs leading-none mb-0.5">Download on</p>
                  <p className="font-semibold text-white text-sm leading-none">App Store</p>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Gyedi Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link href="/guide" className="hover:text-white/60 transition-colors">Help</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}