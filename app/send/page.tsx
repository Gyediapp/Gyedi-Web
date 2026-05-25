'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Recipient = { name: string; id: string; averageRating: number | null; totalRatings: number };

function fmt(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function isGhanaLocal(phone: string) {
  return /^0[235]\d{8}$/.test(phone.trim());
}

export default function SendPage() {
  const [step, setStep]           = useState<'phone' | 'amount' | 'success'>('phone');
  const [phone, setPhone]         = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [token, setToken]         = useState('');

  useEffect(() => {
    const t = localStorage.getItem('gyedi_token');
    if (!t) { window.location.href = '/login'; return; }
    setToken(t);
  }, []);

  async function resolvePhone() {
    if (!isGhanaLocal(phone)) {
      setError('Enter a valid Ghana number: 0XXXXXXXXX (10 digits)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/transfers/resolve?phone=${encodeURIComponent(phone.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'User not found');
      setRecipient({ name: data.name, id: data.id, averageRating: data.averageRating, totalRatings: data.totalRatings });
      setStep('amount');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not find user');
    } finally {
      setLoading(false);
    }
  }

  async function sendMoney() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/transfers`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          recipientPhone: phone.trim(),
          amount:         num,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Transfer failed');
      setSuccessMsg(data.message ?? `${fmt(num)} sent to ${recipient?.name}`);
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-6 flex items-center gap-4">
        <Link href="/wallet" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-bold text-lg">Send Money</h1>
          <p className="text-green-300 text-xs">Peer-to-peer transfer</p>
        </div>
      </div>

      <div className="px-4 py-5">
        {/* Success */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">Transfer Successful!</p>
              <p className="text-gray-500 text-sm mt-1">{successMsg}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setStep('phone'); setPhone(''); setRecipient(null); setAmount(''); setNote(''); setSuccessMsg(''); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-[#1B4332] bg-[#1B4332]/10"
              >
                Send Again
              </button>
              <Link href="/wallet" className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#1B4332] text-center">
                Done
              </Link>
            </div>
          </div>
        )}

        {/* Step 1: Phone */}
        {step === 'phone' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Recipient&apos;s Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && resolvePhone()}
                  placeholder="0551234567"
                  className="w-full text-lg font-semibold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent"
                />
                <p className="mt-2 text-xs text-gray-400">Ghana numbers only: 0XX XXXX XXX</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <button
                onClick={resolvePhone}
                disabled={loading || !phone}
                className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Looking up…' : 'Find Recipient →'}
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-amber-700 text-xs font-medium">💡 The recipient must have a Gyedi account registered with this phone number.</p>
            </div>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && recipient && (
          <div className="space-y-4">
            {/* Recipient card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                {recipient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{recipient.name}</p>
                <p className="text-sm text-gray-400">{phone}</p>
                {recipient.averageRating && (
                  <p className="text-xs text-gray-400 mt-0.5">⭐ {recipient.averageRating.toFixed(1)} · {recipient.totalRatings} ratings</p>
                )}
              </div>
              <button onClick={() => { setStep('phone'); setRecipient(null); setError(''); }} className="text-xs text-gray-400 underline">Change</button>
            </div>

            {/* Amount */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-semibold">GHS</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 text-3xl font-black text-gray-900 placeholder-gray-200 border-none outline-none bg-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Note <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={200}
                  placeholder="What's this for?"
                  className="w-full text-sm text-gray-700 placeholder-gray-300 border-none outline-none bg-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            {/* Confirm summary */}
            {parseFloat(amount) > 0 && (
              <div className="bg-[#1B4332]/5 rounded-2xl p-4 text-sm text-gray-700 flex items-center justify-between">
                <span>Sending to <strong>{recipient.name}</strong></span>
                <span className="font-black text-[#1B4332] text-base">{fmt(parseFloat(amount))}</span>
              </div>
            )}

            <button
              onClick={sendMoney}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-bold py-4 rounded-2xl transition-colors text-sm shadow-sm"
            >
              {loading ? 'Sending…' : `Send ${parseFloat(amount) > 0 ? fmt(parseFloat(amount)) : ''} →`}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
