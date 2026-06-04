import Link from 'next/link';

const BUYER_STEPS = [
  {
    step: 1,
    icon: '📱',
    title: 'Create Your Account',
    desc: 'Sign up with your Ghana phone number. Takes less than 2 minutes. No email needed.',
    tip: 'Use your MTN or Vodafone number — you\'ll use it to receive payments too.',
    action: { label: 'Create Account', href: '/register' },
  },
  {
    step: 2,
    icon: '🔍',
    title: 'Browse the Marketplace',
    desc: 'Search for what you need — phones, clothes, cars, furniture and more. Filter by category, condition and price.',
    tip: 'Use the search bar at the top or browse by category cards on the homepage.',
    action: { label: 'Browse Now', href: '/marketplace' },
  },
  {
    step: 3,
    icon: '🔒',
    title: 'Pay into Escrow',
    desc: 'Found something you like? Click "Buy Safely with Gyedi". Your money is held securely — the seller cannot access it yet.',
    tip: 'Your money is 100% safe. Gyedi holds it until you confirm you\'re happy.',
    action: null,
  },
  {
    step: 4,
    icon: '📦',
    title: 'Receive Your Item',
    desc: 'The seller ships or delivers your item. Track the status in your transaction history.',
    tip: 'Always inspect your item carefully before confirming receipt.',
    action: { label: 'View Transactions', href: '/history' },
  },
  {
    step: 5,
    icon: '✅',
    title: 'Confirm & Release Payment',
    desc: 'Happy with your item? Confirm receipt and Gyedi instantly releases the payment to the seller.',
    tip: 'Only confirm when you\'re fully satisfied. Once confirmed, payment is released.',
    action: null,
  },
  {
    step: 6,
    icon: '⭐',
    title: 'Rate the Seller',
    desc: 'Leave an honest review to help other buyers. Good sellers deserve recognition!',
    tip: 'Your reviews help build trust in the Gyedi community.',
    action: null,
  },
];

const SELLER_STEPS = [
  {
    step: 1,
    icon: '📱',
    title: 'Create Your Account',
    desc: 'Sign up with your Ghana phone number and set up your seller profile.',
    tip: 'Add a store name and profile photo to look more professional.',
    action: { label: 'Create Account', href: '/register' },
  },
  {
    step: 2,
    icon: '🪪',
    title: 'Complete KYC Verification',
    desc: 'Upload your Ghana ID or passport. This builds trust with buyers and unlocks full selling features.',
    tip: 'KYC verified sellers get a green badge — buyers prefer verified sellers!',
    action: { label: 'Verify Now', href: '/verify' },
  },
  {
    step: 3,
    icon: '🏪',
    title: 'Set Up Your Store',
    desc: 'Add your store name, bio, banner image and social links. Make it look professional.',
    tip: 'A complete store profile gets 3x more views than an empty one.',
    action: { label: 'Edit Store', href: '/profile' },
  },
  {
    step: 4,
    icon: '📸',
    title: 'List Your Items',
    desc: 'Add photos, set your price, choose a category and condition. Your listing goes live instantly.',
    tip: 'Use the Watermark Tool to protect your photos before uploading.',
    action: { label: 'Add Listing', href: '/sell' },
  },
  {
    step: 5,
    icon: '🔔',
    title: 'Confirm Orders',
    desc: 'When a buyer pays, you\'ll be notified. Confirm the deal and ship or deliver the item.',
    tip: 'Fast responses and quick shipping build your seller rating.',
    action: { label: 'My Store', href: '/my-store' },
  },
  {
    step: 6,
    icon: '💰',
    title: 'Get Paid Instantly',
    desc: 'Once the buyer confirms receipt, Gyedi releases your payment straight to your MoMo account.',
    tip: 'Add your MTN MoMo account in Wallet settings to receive payments.',
    action: { label: 'Wallet', href: '/wallet' },
  },
];

const FAQS = [
  {
    q: 'What is escrow?',
    a: 'Escrow means Gyedi holds the buyer\'s money safely until both parties are satisfied. The seller gets paid only after the buyer confirms they received the item.',
  },
  {
    q: 'What if I don\'t receive my item?',
    a: 'Don\'t confirm receipt. Open a dispute from your transaction page and Gyedi will investigate. Your money stays protected in escrow.',
  },
  {
    q: 'What if the item is not as described?',
    a: 'Open a dispute with photos as evidence. Gyedi\'s team will review and either issue a refund or release payment based on the evidence.',
  },
  {
    q: 'How much does Gyedi charge?',
    a: 'Gyedi charges 1.5% on each escrow transaction — paid by the buyer on top of the item price. Listing is completely free.',
  },
  {
    q: 'How do I get paid as a seller?',
    a: 'Add your MTN MoMo account in your Wallet settings. When a buyer confirms receipt, Gyedi instantly sends your payment to your MoMo number.',
  },
  {
    q: 'Is Gyedi safe for large transactions?',
    a: 'Yes — escrow is actually more important for larger transactions. Gyedi holds any amount safely until delivery is confirmed.',
  },
  {
    q: 'Can I sell outside Ghana?',
    a: 'Yes! Gyedi supports sellers from Ghana, Nigeria, UK, Germany and more. International buyers can also purchase from Ghanaian sellers.',
  },
  {
    q: 'What is KYC verification?',
    a: 'KYC (Know Your Customer) is an identity check where you upload your Ghana ID or passport. It builds trust and unlocks higher transaction limits.',
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Hero */}
      <div className="relative bg-[#1B4332] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 65%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
            Getting Started Guide
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            How Gyedi Works
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Buy and sell safely across Africa. Gyedi holds your payment in escrow until both parties are happy — no scams, no chargebacks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-8 py-4 rounded-xl text-base transition-colors w-full sm:w-auto text-center">
              Get Started Free
            </Link>
            <Link href="/marketplace" className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors w-full sm:w-auto text-center">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            <a href="#buying" className="flex-1 py-4 text-center text-sm font-black text-[#1B4332] border-b-2 border-[#1B4332]">
              🛒 I want to Buy
            </a>
            <a href="#selling" className="flex-1 py-4 text-center text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
              🏪 I want to Sell
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* Buying steps */}
        <section id="buying">
          <div className="text-center mb-8">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">For Buyers</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">How to Buy Safely</h2>
            <p className="text-gray-400 text-sm mt-2">6 simple steps to buy anything with full protection</p>
          </div>
          <div className="space-y-4">
            {BUYER_STEPS.map((s, i) => (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B4332] flex items-center justify-center text-2xl relative">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#F5A623] text-[#1B4332] text-[10px] font-black flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 text-base mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-2">{s.desc}</p>
                  <div className="flex items-start gap-1.5 bg-[#F5A623]/8 rounded-xl px-3 py-2 mb-3">
                    <span className="text-[#F5A623] text-xs flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-xs text-gray-600">{s.tip}</p>
                  </div>
                  {s.action && (
                    <Link href={s.action.href}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4332] hover:underline">
                      {s.action.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Selling steps */}
        <section id="selling">
          <div className="text-center mb-8">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">For Sellers</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">How to Sell & Get Paid</h2>
            <p className="text-gray-400 text-sm mt-2">6 steps to start selling and receiving MoMo payments</p>
          </div>
          <div className="space-y-4">
            {SELLER_STEPS.map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5A623] flex items-center justify-center text-2xl relative">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#1B4332] text-white text-[10px] font-black flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 text-base mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-2">{s.desc}</p>
                  <div className="flex items-start gap-1.5 bg-[#1B4332]/5 rounded-xl px-3 py-2 mb-3">
                    <span className="text-[#1B4332] text-xs flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-xs text-gray-600">{s.tip}</p>
                  </div>
                  {s.action && (
                    <Link href={s.action.href}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#F5A623] hover:underline">
                      {s.action.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust badges */}
        <section className="bg-[#1B4332] rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-black text-white text-center mb-6">Why Gyedi is Safe</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🔒', title: 'Escrow Protected', desc: 'Money held until delivery confirmed' },
              { icon: '🪪', title: 'KYC Verified', desc: 'Every seller identity checked' },
              { icon: '📱', title: 'MoMo Payouts', desc: 'Instant MTN MoMo payments' },
              { icon: '⚖️', title: 'Dispute Resolution', desc: 'Fair and fast conflict resolution' },
            ].map(b => (
              <div key={b.title} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-2">{b.icon}</div>
                <p className="text-white font-black text-sm">{b.title}</p>
                <p className="text-white/50 text-xs mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="text-center mb-8">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-gray-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Ready to Get Started?</h2>
          <p className="text-gray-400 text-sm mb-6">Join thousands of buyers and sellers across Africa</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register"
              className="bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-black px-8 py-4 rounded-xl text-base transition-colors w-full sm:w-auto text-center">
              Create Free Account
            </Link>
            <Link href="/marketplace"
              className="bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black px-8 py-4 rounded-xl text-base transition-colors w-full sm:w-auto text-center">
              Browse Marketplace
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
