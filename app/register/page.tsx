'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, normalizePhone, validatePhone } from '@/lib/phone';
import { setAuthCookie } from '@/lib/auth-cookie';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

type SupportedCountry = {
  code: string; name: string; flag: string; dialCode: string;
  currency: string; currencySymbol: string; isLaunchCountry: boolean;
};

const FALLBACK_COUNTRIES: SupportedCountry[] = [
  { code: 'GH', name: 'Ghana',          flag: '🇬🇭', dialCode: '+233', currency: 'GHS', currencySymbol: '₵',   isLaunchCountry: true },
  { code: 'NG', name: 'Nigeria',         flag: '🇳🇬', dialCode: '+234', currency: 'NGN', currencySymbol: '₦',   isLaunchCountry: false },
  { code: 'GB', name: 'United Kingdom',  flag: '🇬🇧', dialCode: '+44',  currency: 'GBP', currencySymbol: '£',   isLaunchCountry: false },
  { code: 'US', name: 'United States',   flag: '🇺🇸', dialCode: '+1',   currency: 'USD', currencySymbol: '$',   isLaunchCountry: false },
  { code: 'DE', name: 'Germany',         flag: '🇩🇪', dialCode: '+49',  currency: 'EUR', currencySymbol: '€',   isLaunchCountry: false },
  { code: 'CA', name: 'Canada',          flag: '🇨🇦', dialCode: '+1',   currency: 'CAD', currencySymbol: 'CA$', isLaunchCountry: false },
  { code: 'AU', name: 'Australia',       flag: '🇦🇺', dialCode: '+61',  currency: 'AUD', currencySymbol: 'A$',  isLaunchCountry: false },
  { code: 'ZA', name: 'South Africa',    flag: '🇿🇦', dialCode: '+27',  currency: 'ZAR', currencySymbol: 'R',   isLaunchCountry: false },
];

function RegisterContent() {
  const searchParams              = useSearchParams();
  const refCode                   = searchParams.get('ref') ?? '';
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [countryCode, setCountryCode] = useState('+233');
  const [residenceCountry, setResidenceCountry] = useState('GH');
  const [supportedCountries, setSupportedCountries] = useState<SupportedCountry[]>(FALLBACK_COUNTRIES);
  const [myCode, setMyCode]           = useState<string | null>(null);
  const [rewardAmt, setRewardAmt]     = useState('5.00');

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  useEffect(() => {
    fetch(`${API}/countries`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.countries?.length) setSupportedCountries(d.countries); })
      .catch(() => {});
  }, []);

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError('');

    let recaptchaToken = '';
    if (RECAPTCHA_SITE_KEY) {
      try {
        recaptchaToken = await (window as any).grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'register' });
      } catch {
        setError('Security check failed. Please refresh and try again.');
        setLoading(false);
        return;
      }
    }

    const fd = new FormData(form);

    const pin        = fd.get('pin') as string;
    const confirmPin = fd.get('confirmPin') as string;
    if (pin !== confirmPin) { setError('PINs do not match'); setLoading(false); return; }

    const localPhone = fd.get('localPhone') as string;
    const phoneErr = validatePhone(countryCode, localPhone);
    if (phoneErr) { setError(phoneErr); setLoading(false); return; }
    const phone = normalizePhone(countryCode, localPhone);

    const email = (fd.get('email') as string).trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        firstName: fd.get('firstName'),
        lastName:  fd.get('lastName'),
        phone,
        email,
        pin,
        country:  residenceCountry,
        language: 'en',
        recaptchaToken,
      };
      if (refCode) body.refCode = refCode.toUpperCase();

      const res  = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Registration failed');
      localStorage.setItem('gyedi_token', data.token);
      localStorage.setItem('gyedi_user', JSON.stringify(data.user));
      setAuthCookie(data.token);
      // Fetch referral code + public config to show on success screen
      try {
        const [codeRes, cfgRes] = await Promise.all([
          fetch(`${API}/referrals/code`, { headers: { Authorization: `Bearer ${data.token}` } }),
          fetch(`${API}/config/public`),
        ]);
        const codeData = await codeRes.json();
        const cfgData  = await cfgRes.json().catch(() => ({}));
        if (cfgData?.referralRewardAmount) setRewardAmt(parseFloat(cfgData.referralRewardAmount).toFixed(2));
        if (codeData?.code) { setMyCode(codeData.code); return; }
      } catch { /* fall through to redirect */ }
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (myCode) {
    const link = `https://gyedi.app/join?ref=${myCode}`;
    const waText = encodeURIComponent(`Join me on Gyedi! Use my code ${myCode} to sign up: ${link}`);
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-black text-[#1B4332]">Welcome to Gyedi!</h1>
          <p className="text-gray-500 text-sm">Your account is ready. Start earning by sharing your referral code:</p>

          <div className="bg-white rounded-2xl border-2 border-[#F5A623]/50 p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Your referral code</p>
            <p className="text-4xl font-black text-[#1B4332] tracking-[0.15em]">{myCode}</p>
            <p className="text-xs text-gray-400 mt-3 font-mono break-all">{link}</p>
          </div>

          <p className="text-sm text-gray-600 font-medium">
            Share it and earn <span className="text-[#1B4332] font-black">GHS {rewardAmt}</span> for every friend who signs up!
          </p>

          <div className="flex gap-3">
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#1ebe5d] transition-colors text-center"
            >
              Share on WhatsApp
            </a>
            <a
              href="/dashboard"
              className="flex-1 bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#14532d] transition-colors text-center"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-[#F5A623] font-black text-3xl">Gyedi</span>
          </Link>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>

        {refCode && (
          <div className="mb-4 bg-[#F0FDF4] border border-green-200 text-[#1B4332] text-sm rounded-xl px-4 py-3 text-center font-medium">
            You were referred with code <span className="font-black tracking-wider">{refCode.toUpperCase()}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name</label>
                <input name="firstName" required placeholder="Kwame" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name</label>
                <input name="lastName" required placeholder="Mensah" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Country of Residence</label>
              <select
                value={residenceCountry}
                onChange={e => {
                  const c = supportedCountries.find(sc => sc.code === e.target.value);
                  setResidenceCountry(e.target.value);
                  if (c?.dialCode) setCountryCode(c.dialCode);
                }}
                className={inputCls}
              >
                {supportedCountries.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                    {c.isLaunchCountry ? ' — Available Now' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Where you&apos;re registering from</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">Used for receipts and account recovery</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="px-2 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
                  ))}
                </select>
                <input
                  name="localPhone"
                  type="tel"
                  required
                  placeholder="0551234567"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Leading 0 is removed automatically</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PIN (4 digits)</label>
              <input name="pin" type="password" required minLength={4} maxLength={4} inputMode="numeric" placeholder="••••" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm PIN</label>
              <input name="confirmPin" type="password" required minLength={4} maxLength={4} inputMode="numeric" placeholder="••••" className={inputCls} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1B4332] font-semibold">Log in</Link>
          </p>

          <p className="mt-3 text-center text-xs text-gray-400">
            By registering you agree to Gyedi&apos;s Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
