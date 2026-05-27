'use client';

import { useEffect, useState } from 'react';

const enc = encodeURIComponent;

type PlatformDef = {
  key:       string;
  label:     string;
  sub?:      string;
  emoji:     string;
  bgStyle:   React.CSSProperties;
  dark:      boolean;
  getUrl:    ((url: string, title: string) => string) | null;
};

const PLATFORMS: PlatformDef[] = [
  {
    key: 'whatsapp', label: 'WhatsApp', emoji: '💬',
    bgStyle: { backgroundColor: '#25D366' }, dark: false,
    getUrl: (url, title) => `https://wa.me/?text=${enc(`${title}\n${url}`)}`,
  },
  {
    key: 'facebook', label: 'Facebook', emoji: '📘',
    bgStyle: { backgroundColor: '#1877F2' }, dark: false,
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    key: 'twitter', label: 'X / Twitter', emoji: '✕',
    bgStyle: { backgroundColor: '#000' }, dark: false,
    getUrl: (url, title) => `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(`${title} — Check this out on Gyedi!`)}`,
  },
  {
    key: 'telegram', label: 'Telegram', emoji: '✈',
    bgStyle: { backgroundColor: '#229ED9' }, dark: false,
    getUrl: (url, title) => `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
  },
  {
    key: 'instagram', label: 'Instagram', sub: 'Copy link', emoji: '📸',
    bgStyle: { background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' },
    dark: false, getUrl: null,
  },
  {
    key: 'tiktok', label: 'TikTok', sub: 'Copy link', emoji: '♪',
    bgStyle: { backgroundColor: '#010101' }, dark: false, getUrl: null,
  },
  {
    key: 'email', label: 'Email', emoji: '📧',
    bgStyle: { backgroundColor: '#6B7280' }, dark: false,
    getUrl: (url, title) => `mailto:?subject=${enc(`Check out: ${title}`)}&body=${enc(`${title}\n\n${url}`)}`,
  },
  {
    key: 'copy', label: 'Copy Link', emoji: '🔗',
    bgStyle: { backgroundColor: '#F3F4F6' }, dark: true, getUrl: null,
  },
];

interface Props {
  url:    string;
  title:  string;
  onClose: () => void;
}

export default function ShareModal({ url, title, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function copyLink(key: string) {
    try { await navigator.clipboard.writeText(url); } catch {}
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  }

  function handle(p: PlatformDef) {
    if (p.getUrl) {
      window.open(p.getUrl(url, title), '_blank', 'noopener,noreferrer');
    } else {
      copyLink(p.key);
    }
  }

  const displayUrl = url.replace(/^https?:\/\//, '').slice(0, 52);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" aria-modal role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Drag handle (mobile only) */}
        <div className="sm:hidden pt-3 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-base">Share</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* URL preview chip */}
        <div className="mx-5 mt-3 mb-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-[11px] text-gray-400 truncate font-mono">{displayUrl}</span>
        </div>

        {/* Platform grid — 4 columns × 2 rows */}
        <div className="px-5 pt-3 pb-7 grid grid-cols-4 gap-3">
          {PLATFORMS.map(p => {
            const isCopied = copied === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handle(p)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <span
                  className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 group-active:scale-95 transition-transform duration-150"
                  style={p.bgStyle}
                >
                  {isCopied ? (
                    <svg
                      className="w-5 h-5"
                      style={{ color: p.dark ? '#1B4332' : '#fff' }}
                      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span role="img" aria-label={p.label}>{p.emoji}</span>
                  )}
                </span>
                <span className={`text-[10px] font-semibold text-center leading-tight ${
                  isCopied ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {isCopied ? 'Copied!' : (p.sub ?? p.label)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
