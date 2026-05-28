'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  images: string[];
  title:  string;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  images, initialIdx, title, onClose,
}: { images: string[]; initialIdx: number; title: string; onClose: () => void }) {
  const [idx, setIdx]   = useState(initialIdx);
  const swipeX          = useRef<number | null>(null);

  function go(dir: number) { setIdx(p => (p + dir + images.length) % images.length); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   go(-1);
      if (e.key === 'ArrowRight')  go(1);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ts(e: React.TouchEvent) { swipeX.current = e.touches[0].clientX; }
  function te(e: React.TouchEvent) {
    if (swipeX.current === null) return;
    const d = swipeX.current - e.changedTouches[0].clientX;
    if (Math.abs(d) > 40) go(d > 0 ? 1 : -1);
    swipeX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/96 flex flex-col"
      onTouchStart={ts}
      onTouchEnd={te}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 z-10">
        <p className="text-white/60 text-sm font-medium truncate max-w-[65%]">{title}</p>
        <div className="flex items-center gap-3">
          {images.length > 1 && (
            <span className="text-white/50 text-sm tabular-nums">{idx + 1} / {images.length}</span>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center px-14 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={idx}
          src={images[idx]}
          alt={`${title} — ${idx + 1}`}
          draggable={false}
          className="max-w-full max-h-full object-contain select-none"
        />
      </div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center text-2xl font-bold transition-colors z-20">
            ‹
          </button>
          <button onClick={() => go(1)} aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center text-2xl font-bold transition-colors z-20">
            ›
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 flex-shrink-0 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === idx ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────

function ShareModal({
  title, copied, onClose, onCopyLink, onWhatsApp, onFacebook, onX,
}: {
  title: string; copied: boolean;
  onClose: () => void; onCopyLink: () => void;
  onWhatsApp: () => void; onFacebook: () => void; onX: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Share Listing</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          <p className="text-xs text-gray-400 font-medium mb-3 truncate">{title}</p>

          <button onClick={onWhatsApp}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1db954] text-white font-semibold text-sm transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share on WhatsApp
          </button>

          <button onClick={onFacebook}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Share on Facebook
          </button>

          <button onClick={onX}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold text-sm transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.728-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Share on X
          </button>

          <button onClick={onCopyLink}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
              copied
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}>
            {copied ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main gallery component ────────────────────────────────────────────────────

export default function ListingGallery({ images, title }: Props) {
  const [idx,    setIdx]    = useState(0);
  const [paused, setPaused] = useState(false);
  const [lb,     setLb]     = useState(false);   // lightbox open
  const [share,  setShare]  = useState(false);
  const [copied, setCopied] = useState(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const swipeX    = useRef<number | null>(null);

  // Auto-slideshow: advance every 4 s
  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const id = setInterval(() => setIdx(p => (p + 1) % images.length), 4000);
    return () => clearInterval(id);
  }, [images.length, paused]);

  function pauseThenResume() {
    setPaused(true);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), 8000);
  }

  function go(dir: number) {
    setIdx(p => (p + dir + images.length) % images.length);
    pauseThenResume();
  }

  function pick(i: number) {
    setIdx(i);
    pauseThenResume();
  }

  // Swipe on main image
  function ts(e: React.TouchEvent) { swipeX.current = e.touches[0].clientX; }
  function te(e: React.TouchEvent) {
    if (swipeX.current === null) return;
    const d = swipeX.current - e.changedTouches[0].clientX;
    if (Math.abs(d) > 40) go(d > 0 ? 1 : -1);
    swipeX.current = null;
  }

  // Share helpers
  const getUrl = () => (typeof window !== 'undefined' ? window.location.href : '');
  function shareWA() { window.open(`https://wa.me/?text=${encodeURIComponent(title + '\n' + getUrl())}`); }
  function shareFB() { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`); }
  function shareX()  { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(getUrl())}`); }
  async function copyLink() {
    await navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!images.length) {
    return (
      <div className="aspect-square rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-200 shadow-sm">
        <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* ── Main image ──────────────────────────────────────────────────── */}
        <div
          className="relative group aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm select-none"
          onTouchStart={ts}
          onTouchEnd={te}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={idx}
            src={images[idx]}
            alt={title}
            draggable={false}
            onClick={() => setLb(true)}
            className="w-full h-full object-cover cursor-zoom-in"
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0.25'; }}
          />

          {/* Image counter — bottom right */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none z-10 tabular-nums">
              {idx + 1} / {images.length}
            </div>
          )}

          {/* Prev arrow — always on mobile, hover on desktop */}
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); go(-1); }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/55 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xl font-bold z-10 transition-all
                         opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >‹</button>
          )}

          {/* Next arrow */}
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); go(1); }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/55 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xl font-bold z-10 transition-all
                         opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >›</button>
          )}

          {/* Expand button — top left, hover only */}
          <button
            onClick={e => { e.stopPropagation(); setLb(true); }}
            aria-label="View fullscreen"
            className="absolute top-3 left-3 w-8 h-8 bg-black/55 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-10 transition-all opacity-0 group-hover:opacity-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>

          {/* Share button — top right, hover only */}
          <button
            onClick={e => { e.stopPropagation(); setShare(true); }}
            aria-label="Share listing"
            className="absolute top-3 right-3 w-8 h-8 bg-black/55 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-10 transition-all opacity-0 group-hover:opacity-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Dot indicator (≤ 7 images) */}
          {images.length > 1 && images.length <= 7 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
              {images.map((_, i) => (
                <div key={i} className={`rounded-full bg-white transition-all duration-300 ${
                  i === idx ? 'w-4 h-1.5' : 'w-1.5 h-1.5 opacity-50'
                }`} />
              ))}
            </div>
          )}
        </div>

        {/* ── Thumbnail row ────────────────────────────────────────────────── */}
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 min-w-0 transition-all duration-200 ${
                  i === idx
                    ? 'border-[#1B4332] ring-2 ring-[#1B4332]/20'
                    : 'border-transparent opacity-55 hover:opacity-90 hover:border-gray-200'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" draggable={false} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lb    && <Lightbox images={images} initialIdx={idx} title={title} onClose={() => setLb(false)} />}
      {share && (
        <ShareModal
          title={title}
          copied={copied}
          onClose={() => setShare(false)}
          onCopyLink={copyLink}
          onWhatsApp={shareWA}
          onFacebook={shareFB}
          onX={shareX}
        />
      )}
    </>
  );
}
