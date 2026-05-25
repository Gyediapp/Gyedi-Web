'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type MomoAccount = { id: string; network: 'MTN' | 'VODAFONE' | 'AIRTELTIGO'; phone: string; name: string; isDefault: boolean };
type Wallet = { balance: string; inEscrow: string; pending: string; accounts: MomoAccount[] };

const NETWORK_STYLE: Record<string, { bg: string; text: string; label: string; abbr: string }> = {
  MTN:        { bg: 'bg-yellow-400',  text: 'text-[#1B4332]', label: 'MTN MoMo',         abbr: 'MTN' },
  VODAFONE:   { bg: 'bg-red-500',     text: 'text-white',     label: 'Vodafone Cash',    abbr: 'V'   },
  AIRTELTIGO: { bg: 'bg-blue-500',    text: 'text-white',     label: 'AirtelTigo Money', abbr: 'AIR' },
};

function fmt(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

export default function WalletPage() {
  const [wallet, setWallet]       = useState<Wallet | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [actionError, setActionError]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [withdrawAccountId, setWithdrawAccountId] = useState('');
  const [withdrawAmount, setWithdrawAmount]       = useState('');

  function getToken() {
    const t = localStorage.getItem('gyedi_token');
    if (!t) { window.location.href = '/login'; return null; }
    return t;
  }

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/wallet`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('gyedi_token'); window.location.href = '/login'; return; }
      const data = await res.json();
      setWallet(data);
      if (data.accounts?.length) setWithdrawAccountId(data.accounts.find((a: MomoAccount) => a.isDefault)?.id ?? data.accounts[0].id);
    } catch { setError('Could not load wallet'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken(); if (!token) return;
    setActionLoading(true); setActionError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res  = await fetch(`${API}/momo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          network:   fd.get('network'),
          phone:     fd.get('phone'),
          name:      fd.get('name'),
          isDefault: fd.get('isDefault') === 'on',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add account');
      setShowAdd(false);
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err: unknown) { setActionError(err instanceof Error ? err.message : 'Error'); }
    finally { setActionLoading(false); }
  }

  async function handleDelete(id: string) {
    const token = getToken(); if (!token) return;
    setActionError('');
    try {
      const res = await fetch(`${API}/momo/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to remove account');
      await load();
    } catch (err: unknown) { setActionError(err instanceof Error ? err.message : 'Error'); }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken(); if (!token) return;
    setActionLoading(true); setActionError('');
    try {
      const res  = await fetch(`${API}/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ momoAccountId: withdrawAccountId, amount: parseFloat(withdrawAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Withdrawal failed');
      setShowWithdraw(false);
      setWithdrawAmount('');
      await load();
    } catch (err: unknown) { setActionError(err instanceof Error ? err.message : 'Error'); }
    finally { setActionLoading(false); }
  }

  const balance = parseFloat(wallet?.balance ?? '0');

  const QUICK_AMOUNTS = [10, 50, 100, 200];

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] px-5 pt-12 pb-8">
        <h1 className="text-white font-bold text-xl mb-6">Wallet</h1>

        {loading ? (
          <div className="bg-[#F5A623]/40 rounded-2xl p-5 h-40 animate-pulse" />
        ) : wallet ? (
          <div className="bg-[#F5A623] rounded-2xl p-5 shadow-lg">
            <p className="text-[#1B4332]/70 text-xs font-semibold mb-1">Available Balance</p>
            <p className="text-[#1B4332] font-black text-4xl mb-4">{fmt(wallet.balance)}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#1B4332]/10 rounded-xl p-3">
                <p className="text-[#1B4332]/60 text-xs mb-0.5">In Escrow</p>
                <p className="text-[#1B4332] font-bold text-sm">{fmt(wallet.inEscrow)}</p>
              </div>
              <div className="bg-[#1B4332]/10 rounded-xl p-3">
                <p className="text-[#1B4332]/60 text-xs mb-0.5">Pending</p>
                <p className="text-[#1B4332] font-bold text-sm">{fmt(wallet.pending)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowWithdraw(true); setActionError(''); }}
                disabled={balance <= 0 || !wallet.accounts.length}
                className="bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Withdraw
              </button>
              <Link
                href="/send"
                className="bg-[#1B4332]/80 hover:bg-[#0F2B1F] text-white font-bold py-3 rounded-xl transition-colors text-sm text-center"
              >
                Send Money
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-sm">{error}</p>
        )}
      </div>

      <div className="px-4 py-5 space-y-4">
        {actionError && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">{actionError}</div>
        )}

        {/* MoMo accounts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">MoMo Accounts</h2>
            <button
              onClick={() => { setShowAdd(!showAdd); setActionError(''); }}
              className="text-xs text-[#1B4332] font-bold flex items-center gap-1"
            >
              <span className="text-base leading-none">+</span> Add
            </button>
          </div>

          {/* Add account form */}
          {showAdd && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-3">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Add MoMo Account</h3>
              <form onSubmit={handleAddAccount} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Network</label>
                  <select name="network" required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]">
                    <option value="MTN">MTN MoMo</option>
                    <option value="VODAFONE">Vodafone Cash</option>
                    <option value="AIRTELTIGO">AirtelTigo Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number</label>
                  <input name="phone" type="tel" required placeholder="0241234567"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                  <p className="mt-1 text-xs text-gray-400">Ghana local format: 0XXXXXXXXX</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Account Name</label>
                  <input name="name" required placeholder="Name on account"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="isDefault" type="checkbox" className="w-4 h-4 accent-[#F5A623]" />
                  <span className="text-sm text-gray-600">Set as default account</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100">Cancel</button>
                  <button type="submit" disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#1B4332] bg-[#F5A623] disabled:opacity-50">
                    {actionLoading ? 'Saving…' : 'Save Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="bg-emerald-50 rounded-2xl h-16 animate-pulse" />)}
            </div>
          ) : wallet?.accounts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <p className="text-gray-400 text-sm">No MoMo accounts yet</p>
              <button onClick={() => setShowAdd(true)} className="mt-2 text-[#1B4332] font-semibold text-sm">Add one now →</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {wallet?.accounts.map(account => {
                const style = NETWORK_STYLE[account.network] ?? { bg: 'bg-gray-200', text: 'text-gray-700', label: account.network, abbr: account.network.slice(0, 3) };
                return (
                  <div key={account.id} className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3 border border-emerald-100 shadow-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                      <span className={`text-xs font-black ${style.text}`}>{style.abbr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{account.name}</p>
                      <p className="text-xs text-gray-500">{style.label} · {account.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {account.isDefault && (
                        <span className="text-[10px] font-bold bg-[#F5A623]/20 text-[#92400E] px-2 py-0.5 rounded-full">Default</span>
                      )}
                      <button onClick={() => handleDelete(account.id)}
                        className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw bottom sheet */}
      {showWithdraw && wallet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowWithdraw(false); setActionError(''); }} />
          <div className="relative bg-white rounded-t-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-1" />
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Withdraw Funds</h3>
              <button
                onClick={() => { setShowWithdraw(false); setActionError(''); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick amount chips */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2.5">Quick amounts</p>
              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setWithdrawAmount(String(amt))}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      withdrawAmount === String(amt)
                        ? 'bg-[#F5A623] text-[#1B4332]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    GHS {amt}
                  </button>
                ))}
                <button
                  onClick={() => setWithdrawAmount(balance.toFixed(2))}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    withdrawAmount === balance.toFixed(2)
                      ? 'bg-[#F5A623] text-[#1B4332]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Max
                </button>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pay to</label>
                <select
                  value={withdrawAccountId}
                  onChange={e => setWithdrawAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                >
                  {wallet.accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {NETWORK_STYLE[a.network]?.label ?? a.network} — {a.phone} ({a.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Amount (GHS)</label>
                <input
                  type="number" min="1" step="0.01" max={balance} required
                  value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
                <p className="mt-1 text-xs text-gray-400">Available: {fmt(wallet.balance)}</p>
              </div>
              {actionError && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">{actionError}</div>
              )}
              <button
                type="submit" disabled={actionLoading || !withdrawAmount}
                className="w-full bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-50 text-[#1B4332] font-bold py-3.5 rounded-xl text-sm"
              >
                {actionLoading ? 'Processing…' : 'Confirm Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
