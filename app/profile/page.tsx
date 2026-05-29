'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';

const API    = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const BUCKET = 'banners';

function fmtFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function uploadBanner(file: File, onProgress: (p: number) => void): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gyedi_token') : null;
  if (!token) throw new Error('Not signed in');

  onProgress(5);
  let fake = 5;
  const ticker = setInterval(() => {
    fake = Math.min(fake + Math.random() * 15, 88);
    onProgress(Math.round(fake));
  }, 450);

  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', BUCKET);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    clearInterval(ticker);

    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try {
        const body = await res.json() as Record<string, string>;
        if (body.error) msg = body.error;
      } catch {}
      if (res.status === 401) msg = 'Not authorized';
      console.error('[profile] banner upload error:', msg);
      throw new Error(msg);
    }

    const data = await res.json() as { publicUrl: string };
    onProgress(100);
    return data.publicUrl;
  } catch (err) {
    clearInterval(ticker);
    throw err;
  }
}

type StoreLink = { label: string; url: string };

type User = {
  id: string; firstName: string; lastName: string; phone: string;
  kycStatus: string; language: string;
  averageRating: number | null; totalRatings: number;
  showPhone: boolean; showEmail: boolean; showWhatsapp: boolean;
  businessPhone: string | null; businessEmail: string | null;
  storeType: string; storeName: string | null; storeBanner: string | null;
  storeBio: string | null; storeTheme: string;
  storeLinks: StoreLink[]; storeActive: boolean;
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
  const [subscription,  setSubscription]  = useState<{ planName: string; endDate: string; autoRenew: boolean } | null>(null);
  const [rewardAmt,     setRewardAmt]     = useState('5');
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    pushEnabled: true, smsEnabled: false, whatsAppEnabled: false,
    escrowUpdates: true, referralUpdates: true, marketingUpdates: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');
  const [saveSuccess,   setSaveSuccess]   = useState('');
  const [saveError,     setSaveError]     = useState('');

  // contact privacy state
  const [showPhone,     setShowPhone]     = useState(false);
  const [showEmail,     setShowEmail]     = useState(false);
  const [showWhatsapp,  setShowWhatsapp]  = useState(false);
  const [bizPhone,      setBizPhone]      = useState('');
  const [bizEmail,      setBizEmail]      = useState('');

  // store state
  const [storeName,       setStoreName]       = useState('');
  const [storeBio,        setStoreBio]        = useState('');
  const [storeBanner,     setStoreBanner]     = useState('');
  const [storeTheme,      setStoreTheme]      = useState('Bold');
  const [storeLinks,      setStoreLinks]      = useState<StoreLink[]>([]);
  const [storeSaving,     setStoreSaving]     = useState(false);
  const [storeSuccess,    setStoreSuccess]    = useState('');
  const [storeError,      setStoreError]      = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerProgress,  setBannerProgress]  = useState(0);
  const [bannerError,     setBannerError]     = useState('');
  const bannerRef = useRef<HTMLInputElement>(null);

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
          setStoreName(d.user.storeName ?? '');
          setStoreBio(d.user.storeBio ?? '');
          setStoreBanner(d.user.storeBanner ?? '');
          setStoreTheme(d.user.storeTheme ?? 'Bold');
          setStoreLinks(Array.isArray(d.user.storeLinks) ? d.user.storeLinks : []);
          localStorage.setItem('gyedi_user', JSON.stringify(d.user));
        } else {
          setError('Could not load profile');
        }
      })
      .catch(() => setError('Could not load profile'))
      .finally(() => setLoading(false));

    // Load subscription status
    fetch(`${API}/subscription/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.subscription) setSubscription({ planName: d.subscription.planName, endDate: d.subscription.endDate, autoRenew: d.subscription.autoRenew }); })
      .catch(() => {});

    fetch(`${API}/config/public`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.referralRewardAmount) setRewardAmt(parseFloat(d.referralRewardAmount).toFixed(0)); })
      .catch(() => {});

    fetch(`${API}/notifications/preferences`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setNotifPrefs(p => ({ ...p, ...d })); })
      .catch(() => {});

    fetch(`${API}/points`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d != null) setPointsBalance(d.points ?? 0); })
      .catch(() => {});
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

  async function saveStoreSettings() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setStoreSaving(true);
    setStoreError('');
    setStoreSuccess('');
    try {
      const res = await fetch(`${API}/users`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          storeName:   storeName.trim() || null,
          storeBio:    storeBio.trim() || null,
          storeBanner: storeBanner.trim() || null,
          storeTheme,
          storeLinks:  storeLinks.filter(l => l.url.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      setUser(data.user);
      setStoreSuccess('Store saved');
      setTimeout(() => setStoreSuccess(''), 2500);
    } catch (err: unknown) {
      setStoreError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setStoreSaving(false);
    }
  }

  async function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setBannerError('Use JPG, PNG or WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBannerError(`${fmtFileSize(file.size)} — max 5MB`);
      return;
    }
    setBannerError('');
    setBannerUploading(true);
    setBannerProgress(0);
    try {
      const url = await uploadBanner(file, setBannerProgress);
      setStoreBanner(url);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBannerUploading(false);
      e.target.value = '';
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
            {/* Points & Community */}
            <a
              href="/community"
              className="flex items-center justify-between bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-2xl shadow-sm p-4 hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5A623]/20 rounded-full flex items-center justify-center text-xl">🪙</div>
                <div>
                  <p className="text-sm font-bold text-white">Community Points</p>
                  <p className="text-xs text-green-300 mt-0.5">
                    {pointsBalance !== null ? `${pointsBalance.toLocaleString()} pts · Visit Community →` : 'Join the community →'}
                  </p>
                </div>
              </div>
              <span className="text-green-300 text-lg">›</span>
            </a>

            {/* Seller Plan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-gray-900 text-sm">Seller Plan</h3>
                <a href="/pricing" className="text-[#1B4332] text-xs font-bold hover:underline">Upgrade ↗</a>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    user.storeType === 'PRO'        ? 'bg-[#F5A623]/15 text-[#D4881A]'   :
                    user.storeType === 'BUSINESS'   ? 'bg-[#1B4332]/10 text-[#1B4332]'   :
                    user.storeType === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700'     :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {user.storeType === 'PRO'        ? '★ Pro Seller'       :
                     user.storeType === 'BUSINESS'   ? '✦ Verified Business' :
                     user.storeType === 'ENTERPRISE' ? '◆ Enterprise'        :
                     'Basic'}
                  </span>
                </div>
                {subscription ? (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Expires {new Date(subscription.endDate).toLocaleDateString('en-GH')}</p>
                    <p className={`text-xs font-semibold ${subscription.autoRenew ? 'text-green-600' : 'text-gray-400'}`}>
                      Auto-renew {subscription.autoRenew ? 'on' : 'off'}
                    </p>
                  </div>
                ) : user.storeType === 'BASIC' ? (
                  <a href="/pricing" className="text-xs bg-[#F5A623] text-[#1B4332] font-black px-3 py-1.5 rounded-full hover:bg-[#D4881A] transition-colors">
                    Upgrade Now
                  </a>
                ) : null}
              </div>
            </div>

            {/* Listing shortcuts */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/my-listings"
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-[#1B4332]/5 rounded-full flex items-center justify-center text-xl flex-shrink-0">🏪</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Manage</p>
                  <p className="text-xs text-gray-400">My listings</p>
                </div>
              </a>
              <a
                href="/sell"
                className="flex items-center gap-3 bg-[#F5A623]/10 rounded-2xl border border-[#F5A623]/30 shadow-sm p-4 hover:bg-[#F5A623]/20 transition-colors"
              >
                <div className="w-10 h-10 bg-[#F5A623]/30 rounded-full flex items-center justify-center text-xl flex-shrink-0">➕</div>
                <div>
                  <p className="text-sm font-bold text-[#92400E]">Add Listing</p>
                  <p className="text-xs text-[#92400E]/70">Sell something</p>
                </div>
              </a>
            </div>

            {/* Refer & Earn */}
            <a
              href="/referrals"
              className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">🎁</div>
                <div>
                  <p className="text-sm font-bold text-purple-700">Refer & Earn</p>
                  <p className="text-xs text-gray-400">Invite friends, earn ₵{rewardAmt} each</p>
                </div>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </a>

            {/* KYC Status */}
            <div className={`rounded-2xl p-4 border ${kyc.bg} border-current/10`}>
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
                  <a
                    href="/verify"
                    className="flex-shrink-0 bg-[#1B4332] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#0F2B1F] transition-colors"
                  >
                    {user.kycStatus === 'REJECTED' ? 'Resubmit' : 'Verify'}
                  </a>
                )}
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

            {/* My Store */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-[#1B4332]">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">My Store</p>
                <a href={`/store/${user.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#1B4332] font-semibold hover:underline">View Store →</a>
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* Store URL */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-xs text-gray-400">🔗 Store URL:</span>
                  <span className="text-xs font-mono text-[#1B4332] truncate">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://gyedi.com'}/store/{user.id}
                  </span>
                </div>

                {/* Store name */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Store Name</label>
                  <input value={storeName} onChange={e => setStoreName(e.target.value)}
                    maxLength={60}
                    placeholder={`${user.firstName} ${user.lastName}`}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]" />
                </div>

                {/* Bio */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Store Bio <span className="text-gray-300">({storeBio.length}/300)</span>
                  </label>
                  <textarea value={storeBio} onChange={e => setStoreBio(e.target.value.slice(0, 300))}
                    rows={3} placeholder="Describe your store, what you sell…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] resize-none" />
                </div>

                {/* Banner Image Upload */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">Banner Image</label>

                  {/* Preview */}
                  {storeBanner ? (
                    <div className="relative rounded-xl overflow-hidden mb-2 border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={storeBanner} alt="banner" className="w-full h-24 object-cover" />
                      <button type="button" onClick={() => setStoreBanner('')}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors">
                        ×
                      </button>
                    </div>
                  ) : null}

                  {/* Upload button + progress */}
                  {bannerUploading ? (
                    <div className="border border-gray-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-3 h-3 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span className="text-xs text-[#1B4332] font-semibold">Uploading… {bannerProgress}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full">
                        <div className="h-1 bg-[#1B4332] rounded-full transition-all" style={{ width: `${bannerProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => bannerRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {storeBanner ? 'Replace banner' : 'Upload banner'} · JPG, PNG or WebP · max 5MB
                    </button>
                  )}
                  {bannerError && <p className="text-xs text-red-500 mt-1">{bannerError}</p>}
                  <input ref={bannerRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden" onChange={handleBannerFile} />
                </div>

                {/* Theme */}
                <div>
                  <label className="text-xs text-gray-500 block mb-2">Store Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Minimal', 'Bold', 'Warm', 'Professional'] as const).map(th => {
                      const colours: Record<string, string> = {
                        Minimal:      'from-gray-100 to-gray-200',
                        Bold:         'from-[#1B4332] to-[#0F2B1F]',
                        Warm:         'from-amber-700 to-orange-900',
                        Professional: 'from-slate-700 to-slate-900',
                      };
                      return (
                        <button key={th} onClick={() => setStoreTheme(th)}
                          className={`relative h-14 rounded-xl bg-gradient-to-br ${colours[th]} flex items-end p-2 transition-all ${storeTheme === th ? 'ring-2 ring-[#F5A623] ring-offset-1' : 'opacity-70 hover:opacity-100'}`}>
                          <span className="text-white text-xs font-bold">{th}</span>
                          {storeTheme === th && <span className="absolute top-2 right-2 text-[#F5A623] text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Social links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500">Social Links (up to 3)</label>
                    {storeLinks.length < 3 && (
                      <button onClick={() => setStoreLinks(l => [...l, { label: '', url: '' }])}
                        className="text-xs text-[#1B4332] font-semibold hover:underline">+ Add Link</button>
                    )}
                  </div>
                  {storeLinks.map((link, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={link.label}
                        onChange={e => setStoreLinks(ls => ls.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                        placeholder="Label" maxLength={30}
                        className="w-24 border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332]" />
                      <input value={link.url}
                        onChange={e => setStoreLinks(ls => ls.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                        placeholder="https://..." type="url"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332]" />
                      <button onClick={() => setStoreLinks(ls => ls.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 px-2 text-sm">✕</button>
                    </div>
                  ))}
                </div>

                {storeError   && <p className="text-xs text-red-500">{storeError}</p>}
                {storeSuccess && <p className="text-xs text-green-600">✓ {storeSuccess}</p>}

                <button onClick={saveStoreSettings} disabled={storeSaving}
                  className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50 active:scale-[0.98]">
                  {storeSaving ? 'Saving…' : 'Save Store Settings'}
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notifications</p>
              </div>
              <div className="px-5">
                {([
                  { key: 'pushEnabled',      label: 'Push notifications',   desc: 'In-app and device alerts' },
                  { key: 'smsEnabled',       label: 'SMS alerts',           desc: 'Text messages for key events' },
                  { key: 'whatsAppEnabled',  label: 'WhatsApp alerts',      desc: 'Messages via WhatsApp' },
                  { key: 'escrowUpdates',    label: 'Escrow updates',       desc: 'Funded, shipped, confirmed' },
                  { key: 'referralUpdates',  label: 'Referral rewards',     desc: 'When your friends sign up' },
                  { key: 'marketingUpdates', label: 'Promotions',           desc: 'Deals, tips and announcements' },
                ] as const).map(({ key, label, desc }) => (
                  <Toggle
                    key={key}
                    checked={notifPrefs[key]}
                    onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))}
                    label={label}
                    description={desc}
                  />
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
                  className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50"
                >
                  {savingPrefs ? 'Saving…' : 'Save Preferences'}
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
