'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

const FEE_RATE = 0.015;

type Escrow = { id: string; code: string; title: string; amount: string; status: string; buyerId: string };
type PayMethod = 'mtn' | 'vodafone' | 'airteltigo' | 'paystack' | 'flutterwave';

const MOMO_METHODS: PayMethod[] = ['mtn', 'vodafone', 'airteltigo'];

const METHOD_META: Record<PayMethod, { label: string; icon: string; desc: string; color: string }> = {
  mtn:         { label: 'MTN MoMo',       icon: '📱', desc: 'Push to your MTN number',      color: 'border-yellow-400 bg-yellow-50' },
  vodafone:    { label: 'Vodafone Cash',   icon: '📲', desc: 'Push to your Vodafone number', color: 'border-red-400 bg-red-50' },
  airteltigo:  { label: 'AirtelTigo',     icon: '💳', desc: 'AirtelTigo Money',              color: 'border-blue-400 bg-blue-50' },
  paystack:    { label: 'Card / Paystack', icon: '💳', desc: 'Debit, credit, or Paystack MoMo', color: 'border-indigo-400 bg-indigo-50' },
  flutterwave: { label: 'Flutterwave',     icon: '🌊', desc: 'Cards, bank transfer & more',  color: 'border-orange-400 bg-orange-50' },
};

function fmt(n: string | number) {
  return parseFloat(String(n)).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayEscrowPage() {
  const { id } = useParams<{ id: string }>();

  const [escrow,     setEscrow]     = useState<Escrow | null>(null);
  const [method,     setMethod]     = useState<PayMethod>('mtn');
  const [phone,      setPhone]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [polling,    setPolling]    = useState(false);
  const [momoSent,   setMomoSent]   = useState(false);
  const [error,      setError]      = useState('');
  const [verifying,  setVerifying]  = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tok = localStorage.getItem('gyedi_token');
    if (!tok) { window.location.href = '/login'; return; }

    // Handle redirect back from Paystack or Flutterwave
    const sp  = new URLSearchParams(window.location.search);
    const ref = sp.get('reference');           // Paystack
    const txRef = sp.get('tx_ref');            // Flutterwave
    const status = sp.get('status');           // Flutterwave: 'successful'

    if (ref) {
      setVerifying(true);
      verifyPaystack(tok, ref);
      return;
    }
    if (txRef && status === 'successful') {
      setVerifying(true);
      verifyFlutterwave(tok, txRef);
      return;
    }

    // Pre-fill phone from stored user
    const stored = localStorage.getItem('gyedi_user');
    if (stored) {
      try {
        const u = JSON.parse(stored) as { phone?: string };
        if (u.phone) setPhone(u.phone);
      } catch {}
    }

    loadEscrow(tok);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function loadEscrow(tok: string) {
    try {
      const res  = await fetch(`${API}/escrows/${id}`, { headers: { Authorization: `Bearer ${tok}` } });
      const data = await res.json() as { escrow?: Escrow };
      if (!res.ok || !data.escrow) { setError('Escrow not found'); return; }
      if (data.escrow.status !== 'PENDING') {
        window.location.href = `/escrow/${id}`;
        return;
      }
      setEscrow(data.escrow);
    } catch {
      setError('Could not load escrow');
    }
  }

  async function verifyPaystack(tok: string, reference: string) {
    try {
      const res  = await fetch(`${API}/payments/paystack/verify/${reference}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ escrowId: id }),
      });
      if (res.ok) { window.location.href = `/escrow/${id}`; return; }
    } catch {}
    setError('Payment verification failed — contact support if your money was deducted.');
    setVerifying(false);
    loadEscrow(tok);
  }

  async function verifyFlutterwave(tok: string, txRef: string) {
    try {
      const res  = await fetch(`${API}/payments/flutterwave/verify/${txRef}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ escrowId: id }),
      });
      if (res.ok) { window.location.href = `/escrow/${id}`; return; }
    } catch {}
    setError('Payment verification failed — contact support if your money was deducted.');
    setVerifying(false);
    loadEscrow(tok);
  }

  async function handleMoMoPay() {
    setLoading(true); setError('');
    const tok = localStorage.getItem('gyedi_token')!;
    try {
      const res  = await fetch(`${API}/payments/collect`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ escrowId: id, phone }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Payment failed. Please try again.'); setLoading(false); return; }
      setMomoSent(true);
      startPolling(tok);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function startPolling(tok: string) {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 45) {
        clearInterval(pollRef.current!);
        setPolling(false);
        setMomoSent(false);
        setError('Payment timed out. Please try again.');
        return;
      }
      try {
        const res  = await fetch(`${API}/payments/escrow/${id}`, { headers: { Authorization: `Bearer ${tok}` } });
        const data = await res.json() as { escrowStatus?: string; momoStatus?: string };
        if (data.escrowStatus === 'FUNDED') {
          clearInterval(pollRef.current!);
          window.location.href = `/escrow/${id}`;
        } else if (data.momoStatus === 'FAILED') {
          clearInterval(pollRef.current!);
          setPolling(false);
          setMomoSent(false);
          setError('Payment was declined. Please try again.');
        }
      } catch {}
    }, 4000);
  }

  async function handlePaystackPay() {
    setLoading(true); setError('');
    const tok = localStorage.getItem('gyedi_token')!;
    try {
      const res  = await fetch(`${API}/payments/paystack/initiate`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ escrowId: id, redirectUrl: `${window.location.origin}/escrow/${id}/pay` }),
      });
      const data = await res.json() as { authorization_url?: string; error?: string };
      if (!res.ok || !data.authorization_url) { setError(data.error ?? 'Failed to initiate payment'); setLoading(false); return; }
      window.location.href = data.authorization_url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  async function handleFlutterwavePay() {
    setLoading(true); setError('');
    const tok = localStorage.getItem('gyedi_token')!;
    try {
      const res  = await fetch(`${API}/payments/flutterwave/initiate`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ escrowId: id, redirectUrl: `${window.location.origin}/escrow/${id}/pay` }),
      });
      const data = await res.json() as { payment_url?: string; error?: string };
      if (!res.ok || !data.payment_url) { setError(data.error ?? 'Failed to initiate payment'); setLoading(false); return; }
      window.location.href = data.payment_url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  const isMomo       = MOMO_METHODS.includes(method);
  const amount       = escrow ? parseFloat(escrow.amount) : 0;
  const fee          = amount * FEE_RATE;
  const total        = amount + fee;

  // ── Verifying redirect back ─────────────────────────────────────────────────
  if (verifying) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-700 font-semibold">Verifying your payment…</p>
          <p className="text-gray-400 text-sm">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-16">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6 flex items-center gap-4">
        <Link href={`/escrow/${id}`} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-bold text-lg">Fund Escrow</h1>
          <p className="text-green-300 text-xs font-semibold tracking-widest">{escrow?.code ?? '…'}</p>
        </div>
      </div>

      {/* Amount hero */}
      {escrow && (
        <div className="bg-[#1B4332] px-5 pb-6">
          <div className="bg-[#F5A623] rounded-2xl p-5 shadow-lg">
            <p className="text-[#1B4332]/70 text-[10px] font-bold uppercase tracking-widest mb-1">Amount to Pay</p>
            <p className="text-[#1B4332] font-black text-4xl">GHS {fmt(total)}</p>
            <p className="text-[#1B4332]/70 text-xs mt-2">{escrow.title}</p>
            <div className="flex justify-between mt-3 pt-3 border-t border-[#1B4332]/10 text-xs text-[#1B4332]/60">
              <span>Item: GHS {fmt(amount)}</span>
              <span>Gyedi fee (1.5%): GHS {fmt(fee)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Method selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Choose Payment Method</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(METHOD_META) as PayMethod[]).map(m => {
              const meta = METHOD_META[m];
              const active = method === m;
              return (
                <button
                  key={m}
                  onClick={() => { setMethod(m); setMomoSent(false); setError(''); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                    active ? meta.color + ' border-opacity-100' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <span className={`text-xs font-bold leading-tight ${active ? 'text-gray-900' : 'text-gray-600'}`}>{meta.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{meta.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MoMo: phone input OR prompted state */}
        {isMomo && !momoSent && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
              {METHOD_META[method].label} Phone Number
            </label>
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-gray-400 text-base font-semibold">+233</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="241234567"
                className="flex-1 text-base font-semibold text-gray-900 border-none outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-gray-400">Enter the number registered with {METHOD_META[method].label}.</p>
          </div>
        )}

        {isMomo && momoSent && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">📱</div>
            <p className="text-green-800 font-bold text-base">Check Your Phone!</p>
            <p className="text-green-600 text-sm leading-relaxed">
              A payment prompt was sent to <strong>{phone}</strong>.<br />
              Approve it on your {METHOD_META[method].label} to fund this escrow.
            </p>
            {polling && (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm mt-2">
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                Waiting for approval…
              </div>
            )}
            <button
              onClick={() => { setMomoSent(false); if (pollRef.current) clearInterval(pollRef.current); setPolling(false); }}
              className="text-green-700 text-sm font-semibold underline mt-1"
            >
              Didn&apos;t receive it? Try again
            </button>
          </div>
        )}

        {/* Pay buttons */}
        {!momoSent && (
          <>
            {isMomo && (
              <button
                onClick={handleMoMoPay}
                disabled={loading || !phone.trim() || !escrow}
                className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black py-4 rounded-2xl transition-colors shadow-sm text-base active:scale-[0.98]"
              >
                {loading ? 'Sending prompt…' : `Send Payment Prompt · GHS ${fmt(total)}`}
              </button>
            )}

            {method === 'paystack' && (
              <button
                onClick={handlePaystackPay}
                disabled={loading || !escrow}
                className="w-full bg-[#011B33] hover:bg-[#022348] disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-colors shadow-sm text-base active:scale-[0.98]"
              >
                {loading ? 'Redirecting…' : `Pay with Paystack · GHS ${fmt(total)}`}
              </button>
            )}

            {method === 'flutterwave' && (
              <button
                onClick={handleFlutterwavePay}
                disabled={loading || !escrow}
                className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-black py-4 rounded-2xl transition-colors shadow-sm text-base active:scale-[0.98]"
              >
                {loading ? 'Redirecting…' : `Pay with Flutterwave · GHS ${fmt(total)}`}
              </button>
            )}
          </>
        )}

        {/* Security note */}
        <div className="bg-[#1B4332]/5 rounded-2xl p-4 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-[#1B4332]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-[#1B4332] font-semibold text-xs">Gyedi Escrow Protection</p>
            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
              Your funds are held securely and released to the seller only after you confirm receipt of your item.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
