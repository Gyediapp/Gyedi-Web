'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, normalizePhone, validatePhone } from '@/lib/phone';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

function RegisterContent() {
  const searchParams              = useSearchParams();
  const refCode                   = searchParams.get('ref') ?? '';
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countryCode, setCountryCode] = useState('+233');

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);

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
        language: 'en',
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
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
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
