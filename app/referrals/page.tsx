'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';

const API      = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const PWA_BASE = 'https://gyedi-web.vercel.app';

type Stats = { total: number; pending: number; paid: number; totalEarned: number };

export default function ReferralsPage() {
  const [code, setCode]     = useState<string | null>(null);
  const [stats, setStats]   = useState<Stats>({ total: 0, pending: 0, paid: 0, totalEarned: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [rewardAmt, setRewardAmt] = useState('5');

  useEffect(() => {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    async function load() {
      try {
        // /code endpoint auto-generates a code if one doesn't exist yet
        const [codeRes, statsRes, cfgRes] = await Promise.all([
          fetch(`${API}/referrals/code`,  { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/referrals/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/config/public`),
        ]);

        const codeData  = await codeRes.json();
        const statsData = await statsRes.json();
        const cfgData   = await cfgRes.json().catch(() => ({}));
        if (cfgData?.referralRewardAmount) setRewardAmt(parseFloat(cfgData.referralRewardAmount).toFixed(0));

        console.log('[referrals] code response:', codeData);
        console.log('[referrals] stats response:', statsData);

        if (!codeRes.ok) throw new Error(codeData.error ?? `Code fetch failed (${codeRes.status})`);

        setCode(codeData.code ?? null);
        if (statsRes.ok) {
          setStats({
            total:       statsData.total       ?? 0,
            pending:     statsData.pending      ?? 0,
            paid:        statsData.paid         ?? 0,
            totalEarned: statsData.totalEarned  ?? 0,
          });
        }
      } catch (e: any) {
        console.error('[referrals] load error:', e);
        setError(e.message ?? 'Could not load referral data');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const referralLink = code ? `${PWA_BASE}/join?ref=${code}` : '';

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback: select text in a temp input
      const el = document.createElement('input');
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareWhatsApp() {
    if (!code) return;
    const text = encodeURIComponent(
      `Join me on Gyedi! Use my code ${code} to sign up and we both benefit. Sign up here: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-28">
      {/* Header */}
      <div className="bg-[#1B4332] text-white px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="text-sm text-white/70 mt-1">Invite friends — earn ₵{rewardAmt} per verified sign-up</p>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-md mx-auto">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Code card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your referral code</p>

          {loading ? (
            <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ) : code ? (
            <div className="bg-[#F5A623]/10 border-2 border-[#F5A623]/40 rounded-xl px-5 py-4 flex items-center justify-between">
              <span className="text-4xl font-black text-[#1B4332] tracking-[0.15em]">{code}</span>
              <button
                onClick={copyLink}
                className="text-xs font-bold text-[#F5A623] border border-[#F5A623] px-3 py-1.5 rounded-lg hover:bg-[#F5A623] hover:text-[#1B4332] transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No code yet — try refreshing.</p>
          )}

          {/* Referral link display */}
          {referralLink && (
            <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
              <p className="text-xs text-gray-500 truncate flex-1 font-mono">{referralLink}</p>
              <button
                onClick={copyLink}
                className="text-xs font-semibold text-[#1B4332] hover:underline flex-shrink-0"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={copyLink}
              disabled={!code}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#F4F6F8] text-[#1B4332] font-semibold text-sm py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-40"
            >
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
            <button
              onClick={shareWhatsApp}
              disabled={!code}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#1ebe5d] transition disabled:opacity-40"
            >
              WhatsApp
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Referred', value: stats.total,   color: '#1B4332' },
            { label: 'Pending',  value: stats.pending,  color: '#F5A623' },
            { label: 'Paid',     value: stats.paid,     color: '#22C55E' },
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
            ₵{loading ? '—' : Number(stats.totalEarned).toFixed(2)}
          </p>
          <p className="text-xs opacity-60 mt-1">Credited after your friend completes KYC</p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-[#1B4332] mb-4">How it works</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your link or code with friends' },
              { step: '2', text: 'They sign up at gyedi-web.vercel.app/join?ref=YOUR_CODE' },
              { step: '3', text: `You earn ₵${rewardAmt} credited to your Gyedi wallet after they verify KYC` },
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
