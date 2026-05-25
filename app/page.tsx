import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ListingCard from '@/components/ListingCard';

const STEPS = [
  {
    num: '01',
    icon: '📋',
    title: 'List Your Item',
    desc: 'Create a listing with photos, price, and description. Reach buyers across Ghana and beyond.',
  },
  {
    num: '02',
    icon: '💰',
    title: 'Buyer Pays to Escrow',
    desc: "The buyer's money is held securely by Gyedi — not released until they confirm they're happy.",
  },
  {
    num: '03',
    icon: '✅',
    title: 'Confirm & Get Paid',
    desc: 'Buyer confirms receipt. Funds are instantly released to your wallet. No chargebacks, no stress.',
  },
];

const PLANS = [
  {
    name: 'Basic',
    price: 'Free',
    period: 'forever',
    highlight: false,
    features: ['Up to 3 active listings', 'Standard store page', 'Escrow protection on all sales', 'Gyedi trust badge'],
  },
  {
    name: 'Pro',
    price: 'GHS 50',
    period: 'per month',
    highlight: true,
    features: ['Unlimited listings', 'Custom store URL', 'Priority placement', 'Sales analytics dashboard', 'Pro seller badge', 'Email support'],
  },
  {
    name: 'Business',
    price: 'GHS 150',
    period: 'per month',
    highlight: false,
    features: ['Everything in Pro', 'Featured on homepage', 'Business verification badge', 'Bulk listing tools', 'Dedicated account manager', 'API access'],
  },
];

const TESTIMONIALS = [
  {
    name: 'Ama Darko',
    role: 'Electronics Seller, Accra',
    avatar: 'AD',
    quote: "I've sold over GHS 15,000 worth of phones through Gyedi. The escrow means buyers trust me more, and I get paid every time.",
  },
  {
    name: 'Kwame Asante',
    role: 'Buyer, Kumasi',
    avatar: 'KA',
    quote: "Bought a laptop from a seller I'd never met. Gyedi held my money until I confirmed it was legit. No risk, no stress.",
  },
  {
    name: 'Fatima Issah',
    role: 'Fashion Store, Tamale',
    avatar: 'FI',
    quote: "Upgraded to Pro and my sales doubled in a month. The featured placement alone was worth it. Best decision I made.",
  },
];

async function getFeaturedListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { views: 'desc' },
      take: 6,
      include: { seller: { select: { firstName: true, lastName: true, averageRating: true } } },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const listings = await getFeaturedListings();

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[#1B4332] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 65%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }}
          />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-36">
          <div className="max-w-3xl">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/25 text-[#F5A623] text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              Escrow-Protected Trading
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.04] tracking-tight">
              Buy &amp; Sell<br />
              <span className="text-[#F5A623]">with Confidence</span>
            </h1>

            <p className="mt-5 sm:mt-7 text-base sm:text-lg md:text-xl text-white/65 max-w-xl leading-relaxed">
              Gyedi holds your money safely until you confirm the deal is done.
              No scams, no chargebacks — just trusted trades across Ghana and beyond.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/marketplace"
                className="bg-[#F5A623] hover:bg-[#D4881A] active:bg-[#B87315] text-[#1B4332] font-bold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-all shadow-lg shadow-[#F5A623]/20 text-center"
              >
                Browse Marketplace →
              </Link>
              <Link
                href="/sell"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-all border border-white/20 text-center"
              >
                Start Selling Free
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 sm:mt-14 flex flex-wrap gap-x-8 gap-y-5 sm:gap-x-10">
              {[
                { value: '10,000+', label: 'Verified Users' },
                { value: 'GHS 2M+', label: 'Securely Traded' },
                { value: '50,000+', label: 'Safe Transactions' },
              ].map((s, i) => (
                <div key={s.label} className={`${i > 0 ? 'sm:border-l sm:border-white/10 sm:pl-8' : ''}`}>
                  <p className="text-2xl sm:text-3xl font-black text-white">{s.value}</p>
                  <p className="text-white/45 text-xs sm:text-sm mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-[#0F2B1F] py-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-2">
            <span className="text-white/30 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Available in</span>
            {['🇬🇭 Ghana', '🇳🇬 Nigeria', '🇬🇧 UK', '🇩🇪 Germany', '🇺🇸 USA'].map(c => (
              <span key={c} className="text-white/50 text-xs sm:text-sm font-medium">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">How Gyedi Works</h2>
            <p className="text-gray-500 mt-3 text-sm sm:text-base md:text-lg max-w-xl mx-auto">
              Three simple steps to trade safely with anyone, anywhere.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 md:gap-8 relative">
            {/* connector line on desktop */}
            <div className="hidden sm:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1B4332]/8 mb-4 mx-auto">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#F5A623] text-[#1B4332] text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 md:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Featured Listings</h2>
              <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Hot items from verified sellers</p>
            </div>
            <Link href="/marketplace" className="text-[#1B4332] font-semibold text-sm hover:underline flex-shrink-0 ml-4">
              View all →
            </Link>
          </div>
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {listings.map((l: any) => (
                <ListingCard
                  key={l.id}
                  id={l.id}
                  title={l.title}
                  price={l.price.toString()}
                  images={l.images}
                  category={l.category}
                  country={l.country}
                  storeType={l.storeType}
                  views={l.views}
                  sellerName={`${l.seller.firstName} ${l.seller.lastName}`}
                  sellerRating={l.seller.averageRating ? parseFloat(l.seller.averageRating.toString()) : null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">🛍️</p>
              <h3 className="text-xl font-bold text-gray-900">Be the First Seller</h3>
              <p className="text-gray-500 mt-2 mb-6">No listings yet. Create yours and reach thousands of buyers.</p>
              <Link
                href="/sell"
                className="bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Create a Listing
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Simple Pricing</h2>
            <p className="text-gray-500 mt-3 text-sm sm:text-base md:text-lg">Start free. Upgrade when you&apos;re ready to grow.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-5 sm:p-6 md:p-8 border relative transition-all ${
                  plan.highlight
                    ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-2xl shadow-[#1B4332]/25 scale-[1.02] sm:scale-[1.03]'
                    : 'bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F5A623] text-[#1B4332] text-xs font-black px-4 py-1.5 rounded-full shadow">
                    MOST POPULAR
                  </span>
                )}
                <h3 className={`text-xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-[#F5A623]' : 'text-[#1B4332]'}`}>{plan.price}</span>
                  <span className={`text-sm ml-2 ${plan.highlight ? 'text-white/60' : 'text-gray-400'}`}>/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-white/80' : 'text-gray-600'}`}>
                      <span className={`mt-0.5 font-bold shrink-0 ${plan.highlight ? 'text-[#F5A623]' : 'text-[#1B4332]'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sell"
                  className={`block text-center font-bold py-3 rounded-xl transition-colors text-sm ${
                    plan.highlight
                      ? 'bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.price === 'Free' ? 'Get Started Free' : `Start ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-12 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Loved by Traders</h2>
            <p className="text-gray-500 mt-3 text-sm md:text-base">Real stories from the Gyedi community</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-[#F5A623]">★</span>)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-14 md:py-24 bg-[#1B4332] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 right-0 w-96 h-96 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-[#F5A623]/15 border border-[#F5A623]/20 text-[#F5A623] text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
            Mobile App
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">Trade Anywhere, Anytime</h2>
          <p className="text-white/55 text-sm sm:text-base md:text-lg mb-8 md:mb-10 max-w-lg mx-auto leading-relaxed">
            Download the Gyedi app to manage escrows, get paid, and track your transactions on the go.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-[#1B4332] font-bold px-7 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-xl text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5 text-[#F5A623] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l15 8.5c.6.34.6 1.26 0 1.6l-15 8.5c-.66.5-1.6.03-1.6-.8z"/>
              </svg>
              Download on Google Play
            </a>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-4 rounded-xl transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              Browse on Web →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
