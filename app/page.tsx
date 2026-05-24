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
            className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-[#F5A623]/20 text-[#F5A623] text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-[#F5A623]/30">
              🔒 Escrow-Protected Trading
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
              Buy &amp; Sell<br />
              <span className="text-[#F5A623]">with Confidence</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
              Gyedi holds your money safely until you confirm the deal is done.
              No scams. No chargebacks. Just trusted trades — across Ghana and beyond.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/marketplace"
                className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-bold px-8 py-4 rounded-xl text-base transition-colors shadow-lg"
              >
                Browse Marketplace →
              </Link>
              <Link
                href="/sell"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors border border-white/20"
              >
                Start Selling Free
              </Link>
            </div>
            <div className="mt-14 flex flex-wrap gap-8">
              {[
                { value: '10,000+', label: 'Verified Users' },
                { value: 'GHS 2M+', label: 'Securely Traded' },
                { value: '50,000+', label: 'Safe Transactions' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-white/50 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Countries bar */}
      <section className="bg-[#0F2B1F] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-white/40 font-medium">
            {['🇬🇭 Ghana', '🇳🇬 Nigeria', '🇬🇧 United Kingdom', '🇩🇪 Germany', '🇫🇷 France', '🇺🇸 United States'].map(c => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900">How Gyedi Works</h2>
            <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
              Three simple steps to trade safely with anyone, anywhere.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-5xl mb-4">{step.icon}</div>
                <span className="text-[#F5A623] font-black text-xs tracking-widest">{step.num}</span>
                <h3 className="text-xl font-black text-gray-900 mt-2 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-black text-gray-900">Featured Listings</h2>
              <p className="text-gray-500 mt-2">Hot items from verified sellers</p>
            </div>
            <Link href="/marketplace" className="text-[#1B4332] font-semibold text-sm hover:underline">
              View all →
            </Link>
          </div>
          {listings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
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
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900">Simple Pricing</h2>
            <p className="text-gray-500 mt-4 text-lg">Start free. Upgrade when you&apos;re ready to grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border relative ${
                  plan.highlight
                    ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-2xl'
                    : 'bg-white border-gray-200'
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
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900">Loved by Traders</h2>
            <p className="text-gray-500 mt-4">Real stories from the Gyedi community</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-[#F5A623] text-sm">★</span>)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-20 bg-[#1B4332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Trade Anywhere, Anytime</h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Download the Gyedi app and manage your listings, escrows, and payments on the go.
          </p>
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-[#1B4332] font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-xl text-base"
          >
            <svg className="w-6 h-6 text-[#F5A623]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l15 8.5c.6.34.6 1.26 0 1.6l-15 8.5c-.66.5-1.6.03-1.6-.8z"/>
            </svg>
            Download on Google Play
          </a>
        </div>
      </section>
    </div>
  );
}
