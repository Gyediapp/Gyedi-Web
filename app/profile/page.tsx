'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type User = {
  id: string; firstName: string; lastName: string; phone: string;
  email?: string | null;
  kycStatus: string; language: string;
  averageRating: number | null; totalRatings: number;
  storeType: string;
};

type Subscription = { planName: string; endDate: string; autoRenew: boolean };

const KYC_STYLE: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  PENDING:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'KYC Pending',   icon: '⏳' },
  SUBMITTED: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Under Review',  icon: '🔍' },
  VERIFIED:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'KYC Verified',  icon: '✅' },
  REJECTED:  { bg: 'bg-red-50',    text: 'text-red-700',    label: 'KYC Rejected',  icon: '❌' },
};

const LANG_LABEL: Record<string, string> = {
  en: 'English', tw: 'Twi', ee: 'Ewe', ga: 'Ga', fr: 'French',
};

function StarRating({ rating, total }: { rating: number | null; total: number }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`w-4 h-4 ${i <= Math.round(r) ? 'text-[#F5A623]' : 'text-gray-200'}`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {rating ? r.toFixed(1) : 'No ratings'}{total > 0 ? ` (${total})` : ''}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#1B4332]' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [user,         setUser]         = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [notifPrefs, setNotifPrefs] = useState({
    pushEnabled: true, smsEnabled: false, whatsAppEnabled: false,
    escrowUpdates: true, referralUpdates: true, marketingUpdates: false,
  });
  const [email,        setEmail]        = useState('');
  const [savingEmail,  setSavingEmail]  = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError,   setEmailError]   = useState('');
  const [savingPrefs,  setSavingPrefs]  = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('gyedi_token'); window.location.href = '/login'; }
        return r.json();
      })
      .then(d => {
        if (d.user) {
          setUser(d.user);
          localStorage.setItem('gyedi_user', JSON.stringify(d.user));
          setEmail(d.user.email ?? '');
        } else {
          setError('Could not load profile');
        }
      })
      .catch(() => setError('Could not load profile'))
      .finally(() => setLoading(false));

    fetch(`${API}/subscription/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.subscription) setSubscription(d.subscription); })
      .catch(() => {});

    fetch(`${API}/notifications/preferences`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setNotifPrefs(p => ({ ...p, ...d })); })
      .catch(() => {});
  }, []);

  async function saveEmail() {
  const token = localStorage.getItem('gyedi_token');
  if (!token) return;
  setSavingEmail(true); setEmailError(''); setEmailSuccess('');
  try {
    const res = await fetch(`${API}/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: email.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to save');
    setEmailSuccess('Email saved ✓');
    setTimeout(() => setEmailSuccess(''), 2500);
  } catch (err: unknown) {
    setEmailError(err instanceof Error ? err.message : 'Failed to save');
  } finally {
    setSavingEmail(false);
  }
}

  function logout() {
    localStorage.removeItem('gyedi_token');
    localStorage.removeItem('gyedi_user');
    window.location.href = '/login';
  }

  const kyc      = KYC_STYLE[user?.kycStatus ?? 'PENDING'] ?? KYC_STYLE.PENDING;
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white font-bold text-xl">Profile</h1>
          <Link href="/notifications" className="relative p-2 text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-24" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F5A623] flex items-center justify-center text-white font-black text-xl flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{user.firstName} {user.lastName}</h2>
              <p className="text-green-300 text-sm">{user.phone}</p>
              <div className="mt-1">
                <StarRating rating={user.averageRating} total={user.totalRatings} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* My Store */}
        <Link
          href="/my-store"
          className="flex items-center gap-4 bg-[#F5A623] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-[#1B4332]/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-black text-[#1B4332] text-base">My Store</p>
            <p className="text-[#1B4332]/70 text-xs font-medium mt-0.5">Manage your listings &amp; orders</p>
          </div>
          <svg className="w-5 h-5 text-[#1B4332]/50 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {user && (
          <>
            {/* KYC Status */}
            <div className={`rounded-2xl p-4 border ${kyc.bg}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{kyc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${kyc.text}`}>{kyc.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user.kycStatus === 'PENDING'   && 'Submit your ID to unlock full features'}
                    {user.kycStatus === 'SUBMITTED' && 'Your documents are being reviewed — usually 24h'}
                    {user.kycStatus === 'VERIFIED'  && 'Your identity has been verified'}
                    {user.kycStatus === 'REJECTED'  && 'Documents were rejected — please resubmit'}
                  </p>
                </div>
                {(user.kycStatus === 'PENDING' || user.kycStatus === 'REJECTED') && (
                  <Link href="/verify"
                    className="flex-shrink-0 bg-[#1B4332] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#0F2B1F] transition-colors">
                    {user.kycStatus === 'REJECTED' ? 'Resubmit' : 'Verify'}
                  </Link>
                )}
              </div>
            </div>

            {/* Seller Plan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-gray-900 text-sm">Seller Plan</h3>
                <Link href="/pricing" className="text-[#1B4332] text-xs font-bold hover:underline">Upgrade ↗</Link>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  user.storeType === 'PRO'        ? 'bg-[#F5A623]/15 text-[#D4881A]' :
                  user.storeType === 'BUSINESS'   ? 'bg-[#1B4332]/10 text-[#1B4332]' :
                  user.storeType === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700'  :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {user.storeType === 'PRO'        ? '⭐ Pro Seller'        :
                   user.storeType === 'BUSINESS'   ? '✪ Verified Business'  :
                   user.storeType === 'ENTERPRISE' ? '⚡ Enterprise'         :
                   'Basic'}
                </span>
                {subscription ? (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Expires {new Date(subscription.endDate).toLocaleDateString('en-GH')}</p>
                    <p className={`text-xs font-semibold ${subscription.autoRenew ? 'text-green-600' : 'text-gray-400'}`}>
                      Auto-renew {subscription.autoRenew ? 'on' : 'off'}
                    </p>
                  </div>
                ) : user.storeType === 'BASIC' ? (
                  <Link href="/pricing"
                    className="text-xs bg-[#F5A623] text-[#1B4332] font-black px-3 py-1.5 rounded-full hover:bg-[#D4881A] transition-colors">
                    Upgrade Now
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-[#F5A623]">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Info</p>
              </div>
              {[
                { label: 'First Name', value: user.firstName },
                { label: 'Last Name',  value: user.lastName },
                { label: 'Phone',      value: user.phone },
                { label: 'Language',   value: LANG_LABEL[user.language] ?? user.language },
                { label: 'KYC Status', value: user.kycStatus },
                { label: 'Rating',     value: user.averageRating ? `${parseFloat(String(user.averageRating)).toFixed(1)} / 5.0 (${user.totalRatings} reviews)` : 'No ratings yet' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

                {/* Email */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Email Address</p>
  <p className="text-xs text-gray-400 mb-3">Optional · used for payment receipts and notifications</p>
  <input
    type="email"
    value={email}
    onChange={e => setEmail(e.target.value)}
    placeholder="e.g. yourname@gmail.com"
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] mb-3"
  />
  {emailError   && <p className="text-xs text-red-500 mb-2">{emailError}</p>}
  {emailSuccess && <p className="text-xs text-green-600 mb-2">{emailSuccess}</p>}
  <button onClick={saveEmail} disabled={savingEmail}
    className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50">
    {savingEmail ? 'Saving…' : 'Save Email'}
  </button>
</div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notifications</p>
              </div>
              <div className="px-5">
                {([
                  { key: 'pushEnabled',      label: 'Push notifications',  desc: 'In-app and device alerts' },
                  { key: 'smsEnabled',       label: 'SMS alerts',          desc: 'Text messages for key events' },
                  { key: 'whatsAppEnabled',  label: 'WhatsApp alerts',     desc: 'Messages via WhatsApp' },
                  { key: 'escrowUpdates',    label: 'Escrow updates',      desc: 'Funded, shipped, confirmed' },
                  { key: 'referralUpdates',  label: 'Referral rewards',    desc: 'When your friends sign up' },
                  { key: 'marketingUpdates', label: 'Promotions',          desc: 'Deals, tips and announcements' },
                ] as const).map(({ key, label, desc }) => (
                  <Toggle key={key} checked={notifPrefs[key]}
                    onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))}
                    label={label} description={desc} />
                ))}
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-gray-50">
                {prefsSuccess && <p className="text-xs text-green-600 mb-2">✓ {prefsSuccess}</p>}
                <button
                  onClick={async () => {
                    const token = localStorage.getItem('gyedi_token');
                    if (!token) return;
                    setSavingPrefs(true);
                    try {
                      await fetch(`${API}/notifications/preferences`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(notifPrefs),
                      });
                      setPrefsSuccess('Saved');
                      setTimeout(() => setPrefsSuccess(''), 2500);
                    } catch {}
                    setSavingPrefs(false);
                  }}
                  disabled={savingPrefs}
                  className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50">
                  {savingPrefs ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">More</p>
              </div>
              {[
                
                { label: 'Notifications',        href: '/notifications',     icon: '🔔' },
                { label: 'Store Settings',       href: '/my-store/settings', icon: '🏪' },
                { label: 'Transaction History',  href: '/history',           icon: '📋' },
                { label: 'Wallet & MoMo',        href: '/wallet',            icon: '💰' },
                { label: 'Store Dashboard',      href: '/my-store',          icon: '📊' },
                { label: 'Gyedi Marketplace',    href: '/marketplace',       icon: '🛒' },
              ].map(({ label, href, icon }) => (
                <Link key={href} href={href}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* Logout */}
            <button onClick={logout}
              className="w-full bg-white border border-red-200 text-red-500 font-bold py-3.5 rounded-2xl text-sm hover:bg-red-50 transition-colors">
              Log Out
            </button>

            <p className="text-center text-xs text-gray-300 pb-2">Gyedi Secure Escrow · v1.0</p>
          </>
        )}
      </div>
    </div>
  );
}