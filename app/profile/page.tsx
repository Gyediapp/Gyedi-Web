'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type User = {
  id: string; firstName: string; lastName: string; phone: string;
  kycStatus: string; language: string;
  averageRating: number | null; totalRatings: number;
  showPhone: boolean; showEmail: boolean; showWhatsapp: boolean;
  businessPhone: string | null; businessEmail: string | null;
};

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
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
          checked ? 'bg-[#1B4332]' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [user,          setUser]          = useState<User | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [saving,        setSaving]        = useState(false);
  const [saveSuccess,   setSaveSuccess]   = useState('');
  const [saveError,     setSaveError]     = useState('');

  // contact privacy state
  const [showPhone,     setShowPhone]     = useState(false);
  const [showEmail,     setShowEmail]     = useState(false);
  const [showWhatsapp,  setShowWhatsapp]  = useState(false);
  const [bizPhone,      setBizPhone]      = useState('');
  const [bizEmail,      setBizEmail]      = useState('');

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
          setShowPhone(d.user.showPhone ?? false);
          setShowEmail(d.user.showEmail ?? false);
          setShowWhatsapp(d.user.showWhatsapp ?? false);
          setBizPhone(d.user.businessPhone ?? '');
          setBizEmail(d.user.businessEmail ?? '');
          localStorage.setItem('gyedi_user', JSON.stringify(d.user));
        } else {
          setError('Could not load profile');
        }
      })
      .catch(() => setError('Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  async function saveContactSettings() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await fetch(`${API}/users`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          showPhone,
          showEmail,
          showWhatsapp,
          businessPhone: bizPhone.trim() || null,
          businessEmail: bizEmail.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      setUser(data.user);
      setSaveSuccess('Saved');
      setTimeout(() => setSaveSuccess(''), 2500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem('gyedi_token');
    localStorage.removeItem('gyedi_user');
    window.location.href = '/login';
  }

  const kyc = KYC_STYLE[user?.kycStatus ?? 'PENDING'] ?? KYC_STYLE.PENDING;
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-8">
        <h1 className="text-white font-bold text-xl mb-6">Profile</h1>

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
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {user && (
          <>
            {/* KYC Status */}
            <div className={`rounded-2xl p-4 flex items-center gap-3 border ${kyc.bg} border-current/10`}>
              <span className="text-2xl">{kyc.icon}</span>
              <div>
                <p className={`text-sm font-bold ${kyc.text}`}>{kyc.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {user.kycStatus === 'PENDING'   && 'Submit your ID to unlock full features'}
                  {user.kycStatus === 'SUBMITTED' && 'Your documents are being reviewed'}
                  {user.kycStatus === 'VERIFIED'  && 'Your identity has been verified'}
                  {user.kycStatus === 'REJECTED'  && 'Please resubmit your documents'}
                </p>
              </div>
            </div>

            {/* Account info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-[#F5A623]">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Info</p>
              </div>
              {[
                { label: 'First Name',  value: user.firstName },
                { label: 'Last Name',   value: user.lastName },
                { label: 'Phone',       value: user.phone },
                { label: 'Language',    value: LANG_LABEL[user.language] ?? user.language },
                { label: 'KYC Status',  value: user.kycStatus },
                { label: 'Rating',      value: user.averageRating ? `${parseFloat(String(user.averageRating)).toFixed(1)} / 5.0 (${user.totalRatings} reviews)` : 'No ratings yet' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            {/* Contact Visibility */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact Visibility</p>
                <p className="text-xs text-gray-400 mt-0.5">Choose what buyers can see on your listings</p>
              </div>
              <div className="px-5">
                <Toggle
                  checked={showPhone}
                  onChange={setShowPhone}
                  label="Show business phone"
                  description="Buyers can call or WhatsApp your business number"
                />
                <Toggle
                  checked={showEmail}
                  onChange={setShowEmail}
                  label="Show business email"
                  description="Buyers can email you directly"
                />
                <Toggle
                  checked={showWhatsapp}
                  onChange={setShowWhatsapp}
                  label="Show WhatsApp link"
                  description="Buyers can start a WhatsApp chat"
                />
              </div>

              {/* Business contact fields */}
              <div className="px-5 pb-5 space-y-3 pt-3 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Contact Details</p>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Business Phone</label>
                  <input
                    value={bizPhone}
                    onChange={e => setBizPhone(e.target.value)}
                    placeholder="e.g. +233 XX XXX XXXX"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Business Email</label>
                  <input
                    value={bizEmail}
                    onChange={e => setBizEmail(e.target.value)}
                    placeholder="e.g. hello@yourbusiness.com"
                    type="email"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]"
                  />
                </div>

                {saveError   && <p className="text-xs text-red-500">{saveError}</p>}
                {saveSuccess && <p className="text-xs text-green-600">✓ {saveSuccess}</p>}

                <button
                  onClick={saveContactSettings}
                  disabled={saving}
                  className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving ? 'Saving…' : 'Save Contact Settings'}
                </button>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">More</p>
              </div>
              {[
                { label: 'Transaction History', href: '/history' },
                { label: 'Wallet & MoMo Accounts', href: '/wallet' },
                { label: 'Gyedi Marketplace', href: '/marketplace' },
              ].map(({ label, href }) => (
                <a key={href} href={href} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50">
                  <span className="text-sm text-gray-700">{label}</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full bg-white border border-red-200 text-red-500 font-bold py-3.5 rounded-2xl text-sm hover:bg-red-50 transition-colors active:scale-[0.98]"
            >
              Log Out
            </button>

            <p className="text-center text-xs text-gray-300 pb-2">Gyedi Secure Escrow · v1.0</p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
