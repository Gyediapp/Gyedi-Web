import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Seller Plans & Pricing | Gyedi',
  description: 'Choose the right plan to grow your business on Gyedi. Start free, upgrade anytime.',
};

const PLANS = [
  {
    slug:    'basic',
    name:    'Basic',
    price:   0,
    badge:   null,
    color:   'border-gray-200',
    popular: false,
    features: [
      { text: '5 active listings',          ok: true  },
      { text: 'Standard store page',         ok: true  },
      { text: 'Escrow on every sale',        ok: true  },
      { text: 'Basic search ranking',        ok: true  },
      { text: 'Custom store banner',         ok: false },
      { text: 'Priority placement',          ok: false },
      { text: 'Free listing boosts',         ok: false },
      { text: 'Sales analytics',             ok: false },
    ],
  },
  {
    slug:    'pro',
    name:    'Pro',
    price:   20,
    badge:   '★ Pro Seller',
    color:   'border-[#F5A623]',
    popular: true,
    features: [
      { text: '20 active listings',           ok: true  },
      { text: 'Gold Pro badge on profile',    ok: true  },
      { text: 'Custom store banner',          ok: true  },
      { text: 'Featured in Top Sellers',      ok: true  },
      { text: 'Priority search ranking',      ok: true  },
      { text: '1 free boost / month',         ok: true  },
      { text: 'Sales analytics',             ok: false  },
      { text: 'Dedicated support',           ok: false  },
    ],
  },
  {
    slug:    'business',
    name:    'Business',
    price:   50,
    badge:   '✦ Verified Business',
    color:   'border-[#1B4332]',
    popular: false,
    features: [
      { text: 'Unlimited listings',           ok: true },
      { text: 'Verified Business badge',      ok: true },
      { text: 'Custom store URL',             ok: true },
      { text: 'Homepage hero feature',        ok: true },
      { text: 'Full sales analytics',         ok: true },
      { text: '3 free boosts / month',        ok: true },
      { text: 'Dedicated support manager',    ok: true },
      { text: 'Bulk listing tools',           ok: true },
    ],
  },
  {
    slug:    'enterprise',
    name:    'Enterprise',
    price:   150,
    badge:   '◆ Enterprise',
    color:   'border-purple-500',
    popular: false,
    features: [
      { text: 'Everything in Business',       ok: true },
      { text: 'API access',                   ok: true },
      { text: '5 staff accounts',             ok: true },
      { text: 'Dedicated account manager',    ok: true },
      { text: '10 free boosts / month',       ok: true },
      { text: 'Custom integrations',          ok: true },
      { text: 'SLA guarantee',                ok: true },
      { text: 'White-glove onboarding',       ok: true },
    ],
  },
];

const FAQS = [
  {
    q: 'Can I change my plan anytime?',
    a: 'Yes — upgrade or downgrade at any time. When you upgrade, your new plan takes effect immediately. Downgrades take effect at the end of your billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept MTN Mobile Money (MoMo) and your Gyedi wallet balance. More payment methods coming soon.',
  },
  {
    q: 'What is a listing boost?',
    a: 'A boost pushes your listing to the top of search results and the homepage. Free boosts come with Pro and above — or buy additional boosts from GHS 5.',
  },
  {
    q: 'Is there a free trial?',
    a: 'The Basic plan is free forever. Pro and Business plans offer a 7-day free trial for new subscribers.',
  },
  {
    q: 'Can I get a discount for paying upfront?',
    a: 'Yes! Pay 6 months upfront and save 10%. Pay 12 months and save 20%. Select the duration when you upgrade.',
  },
  {
    q: 'What happens to my listings if I downgrade?',
    a: "Your extra listings remain visible until they expire or are removed. You won't be able to add new listings beyond the plan's limit.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8]">

      {/* Hero */}
      <section className="bg-[#1B4332] py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="inline-block bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            Seller Plans
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            Grow Your Business<br />
            <span className="text-[#F5A623]">on Your Terms</span>
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Start free. Upgrade when you&apos;re ready. Every plan includes Gyedi&apos;s full escrow protection.
          </p>

          {/* Duration toggle note */}
          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/70 text-sm font-medium">
            💡 Save up to <span className="text-[#F5A623] font-black">20%</span> when you pay annually
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-start">
            {PLANS.map(plan => (
              <div
                key={plan.slug}
                className={`relative bg-white rounded-2xl border-2 ${plan.color} shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden ${plan.popular ? 'lg:-translate-y-3 shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <div className="bg-[#F5A623] text-[#1B4332] text-[11px] font-black text-center py-2 tracking-wider uppercase">
                    ⚡ Most Popular
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    {plan.badge && (
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-2 ${
                        plan.slug === 'pro'        ? 'bg-[#F5A623]/15 text-[#D4881A]' :
                        plan.slug === 'business'   ? 'bg-[#1B4332]/10 text-[#1B4332]' :
                        plan.slug === 'enterprise' ? 'bg-purple-100 text-purple-700'  :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    <h2 className="text-xl font-black text-gray-900">{plan.name}</h2>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div>
                        <span className="text-4xl font-black text-[#1B4332]">Free</span>
                        <span className="text-gray-400 text-sm ml-2">forever</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-4xl font-black text-[#1B4332]">GHS {plan.price}</span>
                          <span className="text-gray-400 text-sm ml-1">/month</span>
                        </div>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                            Save 10% — 6 months
                          </span>
                          <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                            Save 20% — 12 months
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.slug === 'basic' ? '/sell' : `/store/upgrade?plan=${plan.slug}`}
                    className={`block text-center font-bold py-3 rounded-xl transition-colors text-sm mb-6 ${
                      plan.popular
                        ? 'bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332]'
                        : plan.slug === 'business'
                          ? 'bg-[#1B4332] hover:bg-[#0F2B1F] text-white'
                          : plan.slug === 'enterprise'
                            ? 'bg-purple-700 hover:bg-purple-800 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.price === 0 ? 'Get Started Free' : 'Upgrade Now'}
                  </Link>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f.text} className="flex items-center gap-2.5 text-sm">
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                          f.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {f.ok ? '✓' : '✕'}
                        </span>
                        <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Boost packages teaser */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">à la carte</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Boost Individual Listings</h2>
            <p className="text-gray-400 mt-2 text-sm">Don&apos;t need a full plan? Boost a single listing for a fixed price.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'Basic Boost', badge: '🥉', price: 5,  duration: '7 days',  desc: 'Appear above regular listings' },
              { name: 'Pro Boost',   badge: '🥈', price: 15, duration: '30 days', desc: 'Top of category + homepage feature' },
              { name: 'Premium Boost', badge: '🥇', price: 30, duration: '30 days', desc: 'Hero banner + Sponsored badge everywhere' },
            ].map(pkg => (
              <div key={pkg.name} className="bg-[#F4F6F8] rounded-2xl p-5 border border-gray-200 text-center">
                <div className="text-3xl mb-2">{pkg.badge}</div>
                <h3 className="font-black text-gray-900 text-base">{pkg.name}</h3>
                <p className="text-[#1B4332] font-black text-2xl mt-1">GHS {pkg.price}</p>
                <p className="text-gray-400 text-xs mt-0.5">{pkg.duration}</p>
                <p className="text-gray-600 text-sm mt-2">{pkg.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-4">
            Boost a listing directly from the listing detail page when you&apos;re logged in as the seller.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <details key={faq.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm group">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-bold text-gray-900 text-base select-none list-none">
                  {faq.q}
                  <span className="text-[#1B4332] text-xl font-black group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm mb-4">Still have questions?</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
              Explore the Marketplace →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
