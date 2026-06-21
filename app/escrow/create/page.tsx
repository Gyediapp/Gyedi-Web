'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'root';
const FEE_RATE = 0.015;

async function uploadToCloudinary(file: File, token: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bucket', 'kyc');
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    let raw = `Upload failed (${res.status})`;
    try { const b = await res.json() as Record<string, string>; if (b.error) raw = b.error; } catch {}
    throw new Error(raw);
  }
  const data = await res.json() as { publicUrl: string };
  return data.publicUrl;
}

type User = { id: string; firstName: string; lastName: string; phone: string; kycStatus?: string };

function fmt(n: number) {
  return n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Fee breakdown card ─────────────────────────────────────────────────────
function FeeBreakdown({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  const fee      = amount * FEE_RATE;
  const total    = amount + fee;
  const sellerGets = amount;
  return (
    <div className="flex rounded-2xl overflow-hidden border border-[#F5A623]/40 shadow-sm">
      <div className="w-1.5 bg-[#F5A623] flex-shrink-0" />
      <div className="flex-1 bg-white p-4 space-y-2.5">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">💰 Payment Breakdown</p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Item Price</span>
          <span className="font-semibold text-gray-900">GHS {fmt(amount)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Gyedi Fee (1.5%)</span>
          <span className="font-semibold text-gray-500">+ GHS {fmt(fee)}</span>
        </div>
        <div className="h-px bg-gray-100 my-1" />
        <div className="flex justify-between text-sm">
          <span className="font-bold text-gray-900">You Pay Total</span>
          <span className="font-black text-[#F5A623] text-base">GHS {fmt(total)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Seller Receives</span>
          <span className="font-semibold text-[#1B4332]">GHS {fmt(sellerGets)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Show more / less for description ──────────────────────────────────────
const DESC_LIMIT = 150;

function DescriptionBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const truncatable = text.length > DESC_LIMIT;
  const display = !truncatable || expanded ? text : `${text.slice(0, DESC_LIMIT)}…`;

  return (
    <div>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap transition-all duration-200">{display}</p>
      {truncatable && (
        <button
          type="button"
          onClick={() => setExpanded(p => !p)}
          className="text-sm text-[#F5A623] font-bold mt-1 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

// ── Pre-filled summary view (from listing) ─────────────────────────────────
function SummaryView({
  title, amount, sellerId, description, deliveryDays, listingId, deliveryOption,
}: {
  title: string; amount: number; sellerId: string;
  description?: string; deliveryDays?: number; listingId?: string;
  deliveryOption?: string;
}) {
  const [buyerNote, setBuyerNote] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const fee   = amount * FEE_RATE;
  const total = amount + fee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const token = localStorage.getItem('gyedi_token');
    const body: Record<string, unknown> = {
      title, sellerId, amount,
    };
    if (description)          body.description = description;
    if (deliveryDays)         body.dueDate     = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000).toISOString();
    if (listingId)            body.listingId   = listingId;
    if (buyerNote.trim())     body.buyerNote   = buyerNote.trim();
    if (deliveryOption)       body.deliveryOption = deliveryOption;

    try {
      const res  = await fetch(`${API}/escrows`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Failed to create escrow');
      const nextPath = data.escrow.status === 'PENDING'
        ? `/escrow/${data.escrow.id}/pay`
        : `/escrow/${data.escrow.id}`;
      window.location.href = nextPath;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Item header — gold accented card */}
      <div className="flex rounded-2xl overflow-hidden border-2 border-[#F5A623] shadow-md">
        <div className="w-1.5 bg-[#F5A623] flex-shrink-0" />
        <div className="flex-1 bg-white p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">You are buying</p>
          <div className="flex items-start gap-3">
            <span className="text-4xl">🛍️</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-base leading-snug">{title}</p>
              {deliveryOption && (
                <p className="text-xs text-gray-500 mt-1">
                  {({'personal':'🚶','pickup':'🏪','courier':'📦','bus':'🚌','glovo':'🛵'} as any)[deliveryOption] ?? '📦'} Delivery: <span className="font-semibold text-gray-700 capitalize">{deliveryOption}</span>
                </p>
              )}
              {deliveryDays && (
                <p className="text-xs text-gray-500 mt-1">🚚 Delivery within <span className="font-semibold text-gray-700">{deliveryDays} day{deliveryDays !== 1 ? 's' : ''}</span></p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">📋 Description</p>
          <DescriptionBlock text={description} />
        </div>
      )}

      {/* Fee breakdown */}
      <FeeBreakdown amount={amount} />

      {/* Note to seller */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
          📝 Note to Seller <span className="normal-case font-normal text-gray-300">(optional)</span>
        </label>
        <textarea
          value={buyerNote}
          onChange={e => setBuyerNote(e.target.value.slice(0, 200))}
          maxLength={200}
          rows={3}
          placeholder="e.g. Please pack carefully, deliver to Madina…"
          className="w-full text-sm text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent resize-none"
        />
        <p className="text-xs text-gray-300 text-right mt-1">{buyerNote.length}/200 · Private to you</p>
      </div>

      {/* Escrow guarantee */}
      <div className="bg-[#1B4332]/5 rounded-2xl p-4 flex gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <p className="text-[#1B4332] font-semibold text-xs">Gyedi Escrow Protection</p>
          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
            Funds are held securely and released only when you confirm receipt.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black py-4 rounded-2xl transition-colors shadow-sm text-base"
      >
        {loading ? 'Creating Escrow…' : `Create & Fund Escrow · GHS ${fmt(total)}`}
      </button>
    </form>
  );
}

// ── Manual form view ───────────────────────────────────────────────────────
function ManualForm({ user }: { user: User | null }) {
  const [role, setRole]     = useState<'buyer' | 'seller'>('buyer');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const numAmount  = parseFloat(amount) || 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (role === 'seller') return;
    setLoading(true);
    setError('');

    const token = localStorage.getItem('gyedi_token');
    const fd    = new FormData(e.currentTarget);

    const body: Record<string, unknown> = {
      title:       fd.get('title'),
      sellerPhone: (fd.get('sellerPhone') as string).trim(),
      amount:      parseFloat(fd.get('amount') as string),
    };
    const desc    = (fd.get('description') as string).trim();
    const dueDate = fd.get('dueDate') as string;
    const note    = (fd.get('buyerNote') as string).trim();
    if (desc)    body.description = desc;
    if (dueDate) body.dueDate     = new Date(dueDate).toISOString();
    if (note)    body.buyerNote   = note;

    try {
      const res  = await fetch(`${API}/escrows`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to create escrow');
      const nextPath = data.escrow.status === 'PENDING'
        ? `/escrow/${data.escrow.id}/pay`
        : `/escrow/${data.escrow.id}`;
      window.location.href = nextPath;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Role toggle */}
      <div className="bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
        <button type="button" onClick={() => setRole('buyer')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'buyer' ? 'bg-[#1B4332] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
          I&apos;m Buying
        </button>
        <button type="button" onClick={() => setRole('seller')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'seller' ? 'bg-[#F5A623] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
          I&apos;m Selling
        </button>
      </div>

      {role === 'seller' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-800 font-semibold text-sm mb-1">Sellers don&apos;t initiate escrow</p>
              <p className="text-amber-700 text-xs leading-relaxed">
                The buyer creates and funds the escrow. Share your phone number so they can add you as seller.
              </p>
            </div>
          </div>
          {user && (
            <div className="mt-4 bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-amber-100">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Your phone number</p>
                <p className="text-gray-900 font-bold text-sm">{user.phone}</p>
              </div>
              <button type="button" onClick={() => navigator.clipboard.writeText(user.phone)} className="text-xs text-[#1B4332] font-semibold px-3 py-1.5 bg-[#F4F6F8] rounded-lg">
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {role === 'buyer' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Transaction Title</label>
            <input name="title" required minLength={3} placeholder="e.g. iPhone 15 Pro purchase" className="w-full text-sm text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Seller&apos;s Phone Number</label>
            <input name="sellerPhone" type="tel" required placeholder="+233241234567" className="w-full text-sm text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent" />
            <p className="mt-1.5 text-xs text-gray-400">Must include country code (e.g. +233 for Ghana)</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Description <span className="text-gray-300 normal-case">(optional)</span></label>
            <textarea name="description" rows={3} placeholder="Describe the item or service…" className="w-full text-sm text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent resize-none" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Amount (GHS)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-semibold">GHS</span>
              <input name="amount" type="number" required min="1" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 text-xl font-bold text-gray-900 placeholder-gray-200 border-none outline-none bg-transparent" />
            </div>
            {numAmount > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <FeeBreakdown amount={numAmount} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Due Date <span className="text-gray-300 normal-case">(optional)</span></label>
            <input name="dueDate" type="date" min={new Date().toISOString().split('T')[0]} className="w-full text-sm text-gray-900 border-none outline-none bg-transparent" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Note to Seller <span className="text-gray-300 normal-case">(optional)</span></label>
            <textarea name="buyerNote" maxLength={200} rows={2} placeholder="Any instructions or conditions…" className="w-full text-sm text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent resize-none" />
          </div>

          <div className="bg-[#1B4332]/5 rounded-2xl p-4 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-[#1B4332] font-semibold text-xs">Gyedi Escrow Protection</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Your funds are held securely and released only when you confirm receipt.</p>
            </div>
          </div>

          <button type="submit" disabled={loading || numAmount <= 0} className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-bold py-4 rounded-2xl transition-colors shadow-sm text-sm">
            {loading ? 'Creating Escrow…' : `Create Escrow · GHS ${numAmount > 0 ? fmt(numAmount + numAmount * FEE_RATE) : '0.00'}`}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
type KycPhase = 'loading' | 'gate' | 'pending' | 'momo_setup' | 'done';

export default function CreateEscrowPage() {
  const [user,     setUser]     = useState<User | null>(null);
  const [prefill,  setPrefill]  = useState<{
    title: string; amount: number; sellerId: string;
    description?: string; deliveryDays?: number; listingId?: string;
    deliveryOption?: string;
  } | null>(null);

  const [kycPhase,   setKycPhase]   = useState<KycPhase>('loading');
  const [kycCard,    setKycCard]    = useState('');
  const [kycFront,   setKycFront]   = useState<File | null>(null);
  const [kycBack,    setKycBack]    = useState<File | null>(null);
  const [kycSelfie,  setKycSelfie]  = useState<File | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError,   setKycError]   = useState('');
  const [momoMsg,    setMomoMsg]    = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }
    const stored = localStorage.getItem('gyedi_user');
    let cachedUser: User | null = null;
    if (stored) {
      try { cachedUser = JSON.parse(stored); setUser(cachedUser); } catch {}
    }

    const sp = new URLSearchParams(window.location.search);
    const sellerId = sp.get('sellerId');
    const title    = sp.get('title');
    const amtStr   = sp.get('amount');
    if (sellerId && title && amtStr) {
      const amount        = parseFloat(amtStr);
      const description   = sp.get('description') ?? undefined;
      const ddStr         = sp.get('deliveryDays');
      const deliveryDays  = ddStr ? parseInt(ddStr, 10) : undefined;
      const listingId     = sp.get('listingId') ?? undefined;
      const deliveryOption = sp.get('deliveryOption') ?? undefined;
      if (!isNaN(amount) && amount > 0) {
        setPrefill({ title, amount, sellerId, description, deliveryDays, listingId, deliveryOption });
      }
    }

    (async () => {
      let kycStatus = cachedUser?.kycStatus;
      try {
        const res = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const fresh = (data.user ?? data) as User;
          kycStatus = fresh.kycStatus;
          localStorage.setItem('gyedi_user', JSON.stringify(fresh));
          setUser(fresh);
        }
      } catch {}

      if (kycStatus === 'VERIFIED' || kycStatus === 'APPROVED') {
        if (!localStorage.getItem('gyedi_momo_setup')) {
          setKycPhase('momo_setup');
          try {
            const u = JSON.parse(localStorage.getItem('gyedi_user') ?? '{}');
            await fetch(`${API}/momo-accounts`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body:    JSON.stringify({ phone: u.phone, network: 'MTN' }),
            });
          } catch {}
          localStorage.setItem('gyedi_momo_setup', '1');
          setMomoMsg("Identity verified! Your MoMo account has been set up automatically. You're ready to trade safely on Gyedi!");
          await new Promise(r => setTimeout(r, 2500));
        }
        setKycPhase('done');
      } else {
        setKycPhase('gate');
      }
    })();
  }, []);

  async function handleKycSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!kycFront || !kycBack || !kycSelfie) return;
    setKycLoading(true);
    setKycError('');
    const token = localStorage.getItem('gyedi_token');
    try {
      let cardFrontUrl: string, cardBackUrl: string, selfieUrl: string;
      try {
        [cardFrontUrl, cardBackUrl, selfieUrl] = await Promise.all([
          uploadToCloudinary(kycFront, token!),
          uploadToCloudinary(kycBack, token!),
          uploadToCloudinary(kycSelfie, token!),
        ]);
      } catch (err) {
        console.error('[KYC upload] Error uploading to Cloudinary:', err);
        throw new Error('Image upload failed. Please check your connection and try again.');
      }
      const res = await fetch(`${API}/kyc/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ ghanaCard: kycCard, cardFrontUrl, cardBackUrl, selfieUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Submission failed');
      setKycPhase('pending');
    } catch (err: unknown) {
      setKycError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setKycLoading(false);
    }
  }

  const isSummaryMode = prefill !== null;

  if (kycPhase === 'loading') {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (kycPhase === 'momo_setup') {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1B4332]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          {momoMsg ? (
            <>
              <h2 className="text-lg font-black text-[#1B4332]">Account Ready!</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{momoMsg}</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-black text-gray-900">Setting Up Your Account</h2>
              <div className="w-8 h-8 mx-auto border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Setting up your MoMo account…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (kycPhase === 'pending') {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col">
        <div className="bg-[#1B4332] px-5 pt-12 pb-6">
          <h1 className="text-white font-bold text-lg">Identity Verification</h1>
          <p className="text-green-300 text-xs">Documents submitted</p>
        </div>
        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="text-5xl">⏳</div>
            <h2 className="text-xl font-black text-gray-900">Documents Under Review</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your documents are under review. We&apos;ll notify you once verified — usually within 24 hours.
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-xs font-black flex-shrink-0">✓</div>
                <span className="text-sm font-semibold text-[#1B4332]">Verify Identity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-black flex-shrink-0">2</div>
                <span className="text-sm font-semibold text-gray-400">Auto-setup MoMo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-black flex-shrink-0">3</div>
                <span className="text-sm font-semibold text-gray-400">Start Trading</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kycPhase === 'gate') {
    return (
      <div className="min-h-screen bg-[#F4F6F8] pb-16">
        <div className="bg-[#1B4332] px-5 pt-12 pb-6 flex items-center gap-4">
          <button
            onClick={() => history.back()}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Verify Your Identity First</h1>
            <p className="text-green-300 text-xs">Required before any transaction</p>
          </div>
        </div>

        <div className="px-5 py-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              For everyone&apos;s safety, Gyedi requires identity verification before any transaction. This protects both buyers and sellers.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Steps</p>
            <div className="space-y-3">
              {[
                { n: 1, label: 'Verify Identity', active: true  },
                { n: 2, label: 'Auto-setup MoMo', active: false },
                { n: 3, label: 'Start Trading',   active: false },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    s.active ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>{s.n}</div>
                  <span className={`text-sm font-semibold ${s.active ? 'text-[#1B4332]' : 'text-gray-400'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleKycSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Documents</p>

            {kycError && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{kycError}</div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ghana Card Number</label>
              <input
                type="text"
                required
                value={kycCard}
                onChange={e => setKycCard(e.target.value.toUpperCase())}
                placeholder="GHA-XXXXXXXXX-X"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] font-mono tracking-wider"
              />
              <p className="text-xs text-gray-400 mt-1">Format: GHA-XXXXXXXXX-X</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Upload Card Front</label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                kycFront ? 'border-[#1B4332] bg-[#1B4332]/5' : 'border-gray-200 hover:border-[#1B4332]'
              }`}>
                <input type="file" accept="image/*" className="hidden" onChange={e => setKycFront(e.target.files?.[0] ?? null)} />
                <span className="text-2xl">{kycFront ? '✅' : '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{kycFront ? kycFront.name : 'Choose file'}</p>
                  <p className="text-xs text-gray-400">Front of your Ghana Card</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Upload Card Back</label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                kycBack ? 'border-[#1B4332] bg-[#1B4332]/5' : 'border-gray-200 hover:border-[#1B4332]'
              }`}>
                <input type="file" accept="image/*" className="hidden" onChange={e => setKycBack(e.target.files?.[0] ?? null)} />
                <span className="text-2xl">{kycBack ? '✅' : '🔃'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{kycBack ? kycBack.name : 'Choose file'}</p>
                  <p className="text-xs text-gray-400">Back of your Ghana Card</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Take Selfie</label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                kycSelfie ? 'border-[#1B4332] bg-[#1B4332]/5' : 'border-gray-200 hover:border-[#1B4332]'
              }`}>
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => setKycSelfie(e.target.files?.[0] ?? null)} />
                <span className="text-2xl">{kycSelfie ? '✅' : '🤳'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{kycSelfie ? kycSelfie.name : 'Take a selfie'}</p>
                  <p className="text-xs text-gray-400">Clear photo of your face</p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={kycLoading || !kycCard || !kycFront || !kycBack || !kycSelfie}
              className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-colors text-sm"
            >
              {kycLoading ? 'Uploading & Submitting…' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // kycPhase === 'done' — normal escrow form
  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      <div className="bg-[#1B4332] px-5 pt-12 pb-6 flex items-center gap-4">
        <button
          onClick={() => history.back()}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">{isSummaryMode ? 'Review Purchase' : 'New Escrow'}</h1>
          <p className="text-green-300 text-xs">{isSummaryMode ? 'Confirm your order details' : 'Secure transaction'}</p>
        </div>
      </div>

      {momoMsg && (
        <div className="px-4 pt-4">
          <div className="bg-green-50 border border-green-200 text-[#1B4332] text-sm rounded-xl px-4 py-3 flex gap-2 items-start">
            <span className="flex-shrink-0">✓</span>
            <p>{momoMsg}</p>
          </div>
        </div>
      )}

      <div className="px-4 py-5">
        {isSummaryMode ? (
          <SummaryView {...prefill!} />
        ) : (
          <ManualForm user={user} />
        )}
      </div>
    </div>
  );
}
