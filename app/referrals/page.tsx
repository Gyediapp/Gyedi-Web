'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

type Stats = {
  code: string | null;
  total: number;
  pending: number;
  paid: number;
  totalEarned: number;
};

export default function ReferralsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    fetch(`${API}/referrals/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const referralLink = stats?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://app.gyedi.com'}/register?ref=${stats.code}`
    : '';

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareLink() {
    if (!referralLink || !navigator.share) { copyLink(); return; }
    navigator.share({ title: 'Join me on Gyedi', text: 'Buy and sell safely in Ghana with Gyedi — escrow payments, zero risk.', url: referralLink }).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      {/* Header */}
      <div className="bg-[#1B4332] text-white px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="text-sm text-white/70 mt-1">Invite friends, earn ₵5 per verified sign-up</p>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-md mx-auto">
        {/* Referral code card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your referral code</p>
          {loading ? (
            <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-32" />
          ) : (
            <p className="text-3xl font-black text-[#1B4332] tracking-widest">
              {stats?.code ?? '—'}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={copyLink}
              disabled={!stats?.code}
              className="flex-1 bg-[#F4F6F8] text-[#1B4332] font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-200 transition disabled:opacity-40"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={shareLink}
              disabled={!stats?.code}
              className="flex-1 bg-[#1B4332] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[#14532d] transition disabled:opacity-40"
            >
              Share
            </button>
          </div>

          {referralLink && (
            <p className="mt-3 text-xs text-gray-400 break-all">{referralLink}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Referred', value: stats?.total ?? 0, color: '#1B4332' },
            { label: 'Pending', value: stats?.pending ?? 0, color: '#F5A623' },
            { label: 'Paid out', value: stats?.paid ?? 0, color: '#22C55E' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-2xl font-black" style={{ color: s.color }}>
                {loading ? '—' : s.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Total earned */}
        <div className="bg-[#1B4332] rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Total earned</p>
          <p className="text-3xl font-black mt-1">
            ₵{loading ? '—' : (stats?.totalEarned ?? 0).toFixed(2)}
          </p>
          <p className="text-xs opacity-60 mt-1">Credited to your wallet after friend verifies KYC</p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-[#1B4332] mb-4">How it works</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your unique link or code with friends' },
              { step: '2', text: 'They sign up and complete KYC verification' },
              { step: '3', text: 'You earn ₵5 credited to your Gyedi wallet' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
