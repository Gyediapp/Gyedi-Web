'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

const PLANS = [
  {
    slug:  'basic',   name: 'Basic',      price: 0,   badge: null,
    badgeColor: null, color: 'border-gray-200',
    features: ['5 active listings', 'Standard store page'],
  },
  {
    slug:  'pro',     name: 'Pro',        price: 20,  badge: '★ Pro Seller',
    badgeColor: '#F5A623', color: 'border-[#F5A623]',
    features: ['20 active listings', 'Gold Pro badge', 'Custom store banner', '1 free boost/month'],
  },
  {
    slug:  'business', name: 'Business',  price: 50,  badge: '✦ Verified Business',
    badgeColor: '#1B4332', color: 'border-[#1B4332]',
    features: ['Unlimited listings', 'Business badge', 'Custom store URL', '3 free boosts/month'],
  },
  {
    slug:  'enterprise', name: 'Enterprise', price: 150, badge: '◆ Enterprise',
    badgeColor: '#7C3AED', color: 'border-purple-500',
    features: ['Everything in Business', 'API access', '10 free boosts/month'],
  },
];

const DURATIONS = [
  { value: 'monthly',  label: 'Monthly',    discount: 0,    suffix: '/month' },
  { value: '6months',  label: '6 Months',   discount: 0.10, suffix: '/6 mo', saveBadge: 'Save 10%' },
  { value: '12months', label: '12 Months',  discount: 0.20, suffix: '/year',  saveBadge: 'Save 20%' },
];

type Step = 'plan' | 'duration' | 'promo' | 'payment' | 'confirm';

export default function UpgradePage() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const initialSlug   = searchParams.get('plan') ?? 'pro';

  const [step,       setStep]       = useState<Step>('plan');
  const [planSlug,   setPlanSlug]   = useState(initialSlug);
  const [duration,   setDuration]   = useState<'monthly' | '6months' | '12months'>('monthly');
  const [promoCode,  setPromoCode]  = useState('');
  const [promoError, setPromoError] = useState('');
  const [payment,    setPayment]    = useState<'MOMO' | 'WALLET'>('MOMO');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);
  const [plans,      setPlans]      = useState<any[]>([]);

  const plan = PLANS.find(p => p.slug === planSlug) ?? PLANS[1];
  const dur  = DURATIONS.find(d => d.value === duration) ?? DURATIONS[0];
  const months = duration === '12months' ? 12 : duration === '6months' ? 6 : 1;
  const base   = plan.price * months;
  const final  = Math.round(base * (1 - dur.discount) * 100) / 100;

  useEffect(() => {
    fetch(`${API}/plans`)
      .then(r => r.json())
      .then(d => setPlans(d.plans ?? []))
      .catch(() => {});
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('gyedi_token');
    if (!token) { setError('You must be logged in to subscribe.'); setLoading(false); return; }

    // Find planId from fetched plans
    const matched = plans.find((p: any) => p.slug === planSlug);
    if (!matched) { setError('Plan not found.'); setLoading(false); return; }

    try {
      const res = await fetch(`${API}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: matched.id, paymentMethod: payment, promoCode: promoCode || undefined, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Subscription failed');
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const STEPS: Step[] = ['plan', 'duration', 'promo', 'payment', 'confirm'];
  const stepNum = STEPS.indexOf(step) + 1;

  if (done) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🎉</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome to {plan.name}!</h2>
          {plan.badge && (
            <div
              className="inline-block text-sm font-black px-4 py-1.5 rounded-full mb-4"
              style={{ background: `${plan.badgeColor}20`, color: plan.badgeColor ?? '#1B4332' }}
            >
              {plan.badge}
            </div>
          )}
          <p className="text-gray-500 mb-8">Your plan is now active. Start selling with your new features.</p>
          <button
            onClick={() => router.push('/profile')}
            className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold py-4 rounded-xl transition-colors text-base"
          >
            Go to My Profile →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                i < stepNum - 1 ? 'bg-[#1B4332] text-white' :
                i === stepNum - 1 ? 'bg-[#F5A623] text-[#1B4332]' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < stepNum - 1 ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < stepNum - 1 ? 'bg-[#1B4332]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Step 1 — Plan */}
          {step === 'plan' && (
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Choose Your Plan</h2>
              <p className="text-gray-400 text-sm mb-6">Select the plan that fits your selling goals</p>
              <div className="space-y-3">
                {PLANS.filter(p => p.slug !== 'basic').map(p => (
                  <button
                    key={p.slug}
                    onClick={() => setPlanSlug(p.slug)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      planSlug === p.slug ? `${p.color} bg-gray-50` : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900">{p.name}</span>
                        {p.badge && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: `${p.badgeColor}20`, color: p.badgeColor ?? '#555' }}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{p.features.join(' · ')}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-black text-[#1B4332]">GHS {p.price}</p>
                      <p className="text-gray-400 text-xs">/month</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('duration')}
                className="mt-6 w-full bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold py-4 rounded-xl transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Duration */}
          {step === 'duration' && (
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Choose Duration</h2>
              <p className="text-gray-400 text-sm mb-6">Save more when you commit longer</p>
              <div className="space-y-3">
                {DURATIONS.map(d => {
                  const dMonths = d.value === '12months' ? 12 : d.value === '6months' ? 6 : 1;
                  const dPrice  = Math.round(plan.price * dMonths * (1 - d.discount) * 100) / 100;
                  return (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value as any)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        duration === d.value ? 'border-[#1B4332] bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="text-left">
                        <span className="font-bold text-gray-900">{d.label}</span>
                        {d.saveBadge && (
                          <span className="ml-2 text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{d.saveBadge}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#1B4332]">GHS {dPrice}</span>
                        <span className="text-gray-400 text-xs ml-1">{d.suffix}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('plan')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors">← Back</button>
                <button onClick={() => setStep('promo')} className="flex-1 bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold py-4 rounded-xl transition-colors">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Promo code */}
          {step === 'promo' && (
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Promo Code</h2>
              <p className="text-gray-400 text-sm mb-6">Have a promo code? Enter it for an extra discount.</p>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                  placeholder="ENTER CODE"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#1B4332]"
                />
              </div>
              {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
              <p className="text-gray-400 text-xs mt-3">Leave blank to skip — you can always add a code later.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('duration')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors">← Back</button>
                <button onClick={() => setStep('payment')} className="flex-1 bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold py-4 rounded-xl transition-colors">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4 — Payment */}
          {step === 'payment' && (
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Payment Method</h2>
              <p className="text-gray-400 text-sm mb-6">How would you like to pay?</p>
              <div className="space-y-3">
                {[
                  { value: 'MOMO',   label: 'MTN Mobile Money', icon: '📱', desc: 'Pay via MoMo prompt on your phone' },
                  { value: 'WALLET', label: 'Gyedi Wallet',     icon: '💰', desc: 'Use your Gyedi wallet balance' },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPayment(m.value as any)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      payment === m.value ? 'border-[#1B4332] bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{m.label}</p>
                      <p className="text-gray-400 text-xs">{m.desc}</p>
                    </div>
                    {payment === m.value && (
                      <span className="ml-auto text-[#1B4332] font-black">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('promo')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors">← Back</button>
                <button onClick={() => setStep('confirm')} className="flex-1 bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold py-4 rounded-xl transition-colors">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 5 — Confirm */}
          {step === 'confirm' && (
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Confirm Upgrade</h2>
              <p className="text-gray-400 text-sm mb-6">Review your order before confirming</p>

              <div className="bg-[#F4F6F8] rounded-2xl p-5 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-bold text-gray-900">{plan.name}</span>
                </div>
                {plan.badge && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Badge</span>
                    <span className="font-bold" style={{ color: plan.badgeColor ?? '#555' }}>{plan.badge}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-bold text-gray-900">{dur.label}</span>
                </div>
                {dur.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-bold text-green-700">-{dur.discount * 100}%</span>
                  </div>
                )}
                {promoCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Promo code</span>
                    <span className="font-bold font-mono text-green-700">{promoCode}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-bold text-gray-900">{payment === 'MOMO' ? 'MTN MoMo' : 'Gyedi Wallet'}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="font-black text-[#1B4332] text-lg">GHS {final}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('payment')} disabled={loading} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors">← Back</button>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="flex-1 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black py-4 rounded-xl transition-colors"
                >
                  {loading ? 'Processing...' : `Pay GHS ${final} →`}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
