import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0F2B1F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <span className="text-[#F5A623] font-black text-2xl tracking-tight">Gyedi</span>
            <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-xs">
              Ghana&apos;s trusted escrow marketplace. Every deal is protected until you confirm you&apos;re happy.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs font-medium bg-[#F5A623]/20 text-[#F5A623] px-2.5 py-1 rounded-full">🔒 Escrow Protected</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">Marketplace</h3>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Browse Listings</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">Sell an Item</Link></li>
              <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">Learn</h3>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/#testimonials" className="hover:text-white transition-colors">Success Stories</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">Download App</h3>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-xl text-sm border border-white/10"
            >
              <svg className="w-5 h-5 text-[#F5A623]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l15 8.5c.6.34.6 1.26 0 1.6l-15 8.5c-.66.5-1.6.03-1.6-.8z"/>
              </svg>
              <div>
                <p className="text-white/50 text-xs leading-none mb-0.5">Get it on</p>
                <p className="font-semibold text-white leading-none">Google Play</p>
              </div>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Gyedi. All rights reserved. Made in Ghana 🇬🇭</p>
          <div className="flex items-center gap-3 text-xs text-white/30">
            <span>Secure Payments</span>
            <span>·</span>
            <span>KYC Verified</span>
            <span>·</span>
            <span>Buyer Protection</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
