'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COUNTRIES, normalizePhone, validatePhone } from '@/lib/phone';

export default function LoginPage() {
  const [tab, setTab]           = useState<'login' | 'register'>('login');
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [countryCode, setCountryCode] = useState('+233');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd  = new FormData(e.currentTarget);
    const pin = fd.get('pin') as string;

    let body: Record<string, string>;
    if (loginMode === 'phone') {
      const localPhone = fd.get('localPhone') as string;
      const phoneErr   = validatePhone(countryCode, localPhone);
      if (phoneErr) { setError(phoneErr); setLoading(false); return; }
      body = { phone: normalizePhone(countryCode, localPhone), pin };
    } else {
      const email = (fd.get('email') as string).trim();
      if (!email) { setError('Please enter your email address'); setLoading(false); return; }
      body = { email, pin };
    }

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Login failed');
      localStorage.setItem('gyedi_token', data.token);
      localStorage.setItem('gyedi_user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd         = new FormData(e.currentTarget);
    const localPhone = fd.get('localPhone') as string;
    const phoneErr   = validatePhone(countryCode, localPhone);
    if (phoneErr) { setError(phoneErr); setLoading(false); return; }
    const body = {
      firstName: fd.get('firstName'),
      lastName:  fd.get('lastName'),
      phone:     normalizePhone(countryCode, localPhone),
      pin:       fd.get('pin'),
      language:  'en',
    };

    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Registration failed');
      localStorage.setItem('gyedi_token', data.token);
      localStorage.setItem('gyedi_user', JSON.stringify(data.user));
      setSuccess('Account created! Redirecting…');
      setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-[#F5A623] font-black text-3xl">Gyedi</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Secure Escrow Marketplace</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">
                {success}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Login mode toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {(['phone', 'email'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setLoginMode(mode); setError(''); }}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        loginMode === mode
                          ? 'bg-white text-[#1B4332] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {mode === 'phone' ? 'Phone' : 'Email'}
                    </button>
                  ))}
                </div>

                {loginMode === 'phone' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        className="px-2 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
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
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className={inputCls}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIN</label>
                  <input
                    name="pin"
                    type="password"
                    required
                    minLength={4}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="4–6 digit PIN"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  {loading ? 'Logging in…' : 'Log In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                    <input name="firstName" required className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                    <input name="lastName" required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="px-2 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
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
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIN</label>
                  <input
                    name="pin"
                    type="password"
                    required
                    minLength={4}
                    maxLength={6}
                    placeholder="Choose a 4–6 digit PIN"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#1B4332] font-semibold">Register</Link>
            </p>

            <p className="mt-3 text-center text-xs text-gray-400">
              By continuing, you agree to Gyedi&apos;s terms. Existing users with the mobile app can log in here too.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
