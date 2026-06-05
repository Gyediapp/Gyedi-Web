'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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
      try { const body = await res.json() as Record<string, string>; if (body.error) msg = body.error; } catch {}
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
  storeName: string | null; storeBio: string | null; storeBanner: string | null;
  storeTheme: string; storeLinks: StoreLink[];
  showPhone: boolean; showEmail: boolean; showWhatsapp: boolean;
  businessPhone: string | null; businessEmail: string | null;
};

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

export default function StoreSettingsPage() {
  const [user,            setUser]            = useState<User | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [rewardAmt,       setRewardAmt]       = useState('5');

  // Store fields
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

  // Contact fields
  const [showPhone,    setShowPhone]    = useState(false);
  const [showEmail,    setShowEmail]    = useState(false);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [bizPhone,     setBizPhone]     = useState('');
  const [bizEmail,     setBizEmail]     = useState('');
  const [contactSaving,  setContactSaving]  = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError,   setContactError]   = useState('');

  // Share
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setStoreName(d.user.storeName ?? '');
          setStoreBio(d.user.storeBio ?? '');
          setStoreBanner(d.user.storeBanner ?? '');
          setStoreTheme(d.user.storeTheme ?? 'Bold');
          setStoreLinks(Array.isArray(d.user.storeLinks) ? d.user.storeLinks : []);
          setShowPhone(d.user.showPhone ?? false);
          setShowEmail(d.user.showEmail ?? false);
          setShowWhatsapp(d.user.showWhatsapp ?? false);
          setBizPhone(d.user.businessPhone ?? '');
          setBizEmail(d.user.businessEmail ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API}/config/public`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.referralRewardAmount) setRewardAmt(parseFloat(d.referralRewardAmount).toFixed(0)); })
      .catch(() => {});
  }, []);

  async function saveStoreSettings() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setStoreSaving(true); setStoreError(''); setStoreSuccess('');
    try {
      const res = await fetch(`${API}/users`, {
        method: 'PATCH',
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
      setStoreSuccess('Store settings saved ✓');
      setTimeout(() => setStoreSuccess(''), 2500);
    } catch (err: unknown) {
      setStoreError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setStoreSaving(false);
    }
  }

  async function saveContactSettings() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) return;
    setContactSaving(true); setContactError(''); setContactSuccess('');
    try {
      const res = await fetch(`${API}/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          showPhone, showEmail, showWhatsapp,
          businessPhone: bizPhone.trim() || null,
          businessEmail: bizEmail.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      setContactSuccess('Contact settings saved ✓');
      setTimeout(() => setContactSuccess(''), 2500);
    } catch (err: unknown) {
      setContactError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setContactSaving(false);
    }
  }

  async function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
      setBannerError('Use JPG, PNG or WebP'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBannerError(`${fmtFileSize(file.size)} — max 5MB`); return;
    }
    setBannerError(''); setBannerUploading(true); setBannerProgress(0);
    try {
      const url = await uploadBanner(file, setBannerProgress);
      setStoreBanner(url);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBannerUploading(false); e.target.value = '';
    }
  }

  const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/store/${user?.id}` : '';

  function copyLink() {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6 flex items-center gap-4">
        <Link href="/my-store"
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-bold text-lg">Store Settings</h1>
          <p className="text-green-300 text-xs">Manage your store profile</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* Share Store */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">🔗 Share Your Store</p>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400 truncate flex-1 font-mono">{storeUrl}</span>
            <button onClick={copyLink}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${copied ? 'bg-green-100 text-green-700' : 'bg-[#1B4332] text-white'}`}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
             { label: 'WhatsApp',  color: 'bg-green-500',  icon: '💬', href: `https://wa.me/?text=Check out my store on Gyedi: ${storeUrl}` },
             { label: 'Facebook',  color: 'bg-blue-600',   icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${storeUrl}` },
             { label: 'Twitter/X', color: 'bg-black',      icon: '🐦', href: `https://twitter.com/intent/tweet?text=Check out my store on Gyedi&url=${storeUrl}` },
             { label: 'Telegram',  color: 'bg-sky-500',    icon: '✈️', href: `https://t.me/share/url?url=${storeUrl}&text=Check out my store on Gyedi` },
             { label: 'TikTok',    color: 'bg-gray-900',   icon: '🎵', href: `https://www.tiktok.com/share?url=${storeUrl}` },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className={`${s.color} rounded-xl py-3 flex flex-col items-center gap-1 transition-opacity hover:opacity-80`}>
                <span className="text-lg">{s.icon}</span>
                <span className="text-white text-[9px] font-bold">{s.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Store Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Store Profile</p>
            {user && (
              <Link href={`/store/${user.id}`} target="_blank"
                className="text-xs text-[#1B4332] font-semibold hover:underline">View Store →</Link>
            )}
          </div>
          <div className="px-5 py-5 space-y-4">

            {/* Store name */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Store Name</label>
              <input value={storeName} onChange={e => setStoreName(e.target.value)} maxLength={60}
                placeholder={`${user?.firstName} ${user?.lastName}`}
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

            {/* Banner */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Banner Image</label>
              {storeBanner && (
                <div className="relative rounded-xl overflow-hidden mb-2 border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={storeBanner} alt="banner" className="w-full h-24 object-cover" />
                  <button type="button" onClick={() => setStoreBanner('')}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors">×</button>
                </div>
              )}
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
                  {storeBanner ? 'Replace banner' : 'Upload banner'} · max 5MB
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
                {(['Minimal','Bold','Warm','Professional'] as const).map(th => {
                  const colours: Record<string, string> = {
                    Minimal: 'from-gray-100 to-gray-200',
                    Bold: 'from-[#1B4332] to-[#0F2B1F]',
                    Warm: 'from-amber-700 to-orange-900',
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
            {storeSuccess && <p className="text-xs text-green-600">{storeSuccess}</p>}

            <button onClick={saveStoreSettings} disabled={storeSaving}
              className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50">
              {storeSaving ? 'Saving…' : 'Save Store Settings'}
            </button>
          </div>
        </div>

        {/* Contact Visibility */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Contact Visibility</p>
            <p className="text-xs text-gray-400 mt-0.5">Choose what buyers can see on your listings</p>
          </div>
          <div className="px-5">
            <Toggle checked={showPhone} onChange={setShowPhone} label="Show business phone" description="Buyers can call or WhatsApp your business number" />
            <Toggle checked={showEmail} onChange={setShowEmail} label="Show business email" description="Buyers can email you directly" />
            <Toggle checked={showWhatsapp} onChange={setShowWhatsapp} label="Show WhatsApp link" description="Buyers can start a WhatsApp chat" />
          </div>
          <div className="px-5 pb-5 space-y-3 pt-3 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Contact Details</p>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Business Phone</label>
              <input value={bizPhone} onChange={e => setBizPhone(e.target.value)}
                placeholder="e.g. +233 XX XXX XXXX"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Business Email</label>
              <input value={bizEmail} onChange={e => setBizEmail(e.target.value)}
                placeholder="e.g. hello@yourbusiness.com" type="email"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]" />
            </div>
            {contactError   && <p className="text-xs text-red-500">{contactError}</p>}
            {contactSuccess && <p className="text-xs text-green-600">{contactSuccess}</p>}
            <button onClick={saveContactSettings} disabled={contactSaving}
              className="w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#0F2B1F] transition-colors disabled:opacity-50">
              {contactSaving ? 'Saving…' : 'Save Contact Settings'}
            </button>
          </div>
        </div>

        {/* Refer & Earn */}
        <Link href="/referrals"
          className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">🎁</div>
            <div>
              <p className="text-sm font-bold text-purple-700">Refer & Earn</p>
              <p className="text-xs text-gray-400">Invite friends, earn GHS {rewardAmt} each</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

      </div>
    </div>
  );
}