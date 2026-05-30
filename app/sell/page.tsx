'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

const DEFAULT_CATEGORIES = ['Electronics', 'Fashion', 'Vehicles', 'Furniture', 'Services', 'Agriculture', 'Real Estate', 'Other'];
const BUCKET       = 'listings';
const MAX_IMAGES   = 5;
const MAX_SIZE_MB  = 5;
const WARN_SIZE_MB = 4;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

// ── types ────────────────────────────────────────────────────────────────────

type ImageItem = {
  id: string;
  file: File;
  objectUrl: string;
  publicUrl?: string;
  progress?: number;  // 0-100 while uploading
  error?: string;
};

type CropEntry   = { file: File; objectUrl: string };
type CropSession = { entry: CropEntry; croppedAreaPixels: Area | null };

// ── helpers (module-level, no hooks) ─────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function friendlyError(raw: string): string {
  if (!raw) return 'Something went wrong — please try again.';
  const r = raw.toLowerCase();
  if (r.includes('unauthorized') || r.includes('not authorized') || r.includes('401'))
    return 'Session expired — please sign out and back in.';
  if (r.includes('too large') || r.includes('413') || r.includes('5 mb') || r.includes('exceeds'))
    return 'That photo is too large — max 5 MB per image.';
  if (r.includes('unsupported') || r.includes('type') || r.includes('jpg') || r.includes('png'))
    return 'Unsupported file type — use JPG, PNG or WebP.';
  if (r.includes('storage url') || r.includes('not configured') || r.includes('service key'))
    return 'Photo storage is temporarily unavailable — please try again shortly.';
  if (r.includes('network') || r.includes('fetch failed') || r.includes('econnrefused') || r.includes('failed to fetch'))
    return 'Network error — check your connection and try again.';
  if (r.includes('timeout') || r.includes('timed out'))
    return 'Upload timed out — check your connection and retry.';
  return raw;
}

async function uploadFileWithProgress(
  file: File,
  _path: string,
  onProgress: (pct: number) => void,
  token: string,
): Promise<string> {
  onProgress(5);

  // Animate fake progress while the server streams to Supabase
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
      let raw = `Upload failed (${res.status})`;
      try {
        const body = await res.json() as Record<string, string>;
        if (body.error) raw = body.error;
      } catch {}
      const msg = friendlyError(raw);
      console.error('[sell] upload error:', raw);
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

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, mimeType = 'image/jpeg'): Promise<Blob> {
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('Image load failed'));
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas failed')), mimeType, 0.92),
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function SellPage() {
  const [token,        setToken]        = useState<string | null>(null);
  const [images,       setImages]       = useState<ImageItem[]>([]);
  const [cropQueue,    setCropQueue]    = useState<CropEntry[]>([]);
  const [cropSession,  setCropSession]  = useState<CropSession | null>(null);
  const [cropPos,      setCropPos]      = useState({ x: 0, y: 0 });
  const [cropZoom,     setCropZoom]     = useState(1);
  const [cropAspect,   setCropAspect]   = useState(1);
  const [croppedArea,  setCroppedArea]  = useState<Area | null>(null);
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [price,        setPrice]        = useState('');
  const [category,     setCategory]     = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [categories,   setCategories]   = useState<string[]>(DEFAULT_CATEGORIES);
  const fileRef    = useRef<HTMLInputElement>(null);
  const dragFrom   = useRef<number | null>(null);
  const dragTo     = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [preview,     setPreview]     = useState<{ src: string; id: string; index: number } | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('gyedi_token'));
    fetch('/api/categories').then(r => r.json()).then(d => {
      if (Array.isArray(d.categories) && d.categories.length > 0) setCategories(d.categories);
    }).catch(() => {});
    return () => { images.forEach(img => URL.revokeObjectURL(img.objectUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start next crop when queue has items and no active session
  useEffect(() => {
    if (cropSession === null && cropQueue.length > 0) {
      const [next, ...rest] = cropQueue;
      setCropQueue(rest);
      setCropPos({ x: 0, y: 0 });
      setCropZoom(1);
      setCropAspect(1);
      setCroppedArea(null);
      setCropSession({ entry: next, croppedAreaPixels: null });
    }
  }, [cropQueue, cropSession]);

  // ── file selection ──────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError('');
    const errs: string[] = [];
    const toQueue: CropEntry[] = [];
    const available = MAX_IMAGES - images.length - cropQueue.length - (cropSession ? 1 : 0);

    for (const f of files) {
      if (toQueue.length >= available) break;
      if (!ALLOWED_TYPES.has(f.type)) {
        errs.push(`${f.name}: not a valid format — use JPG, PNG or WebP`);
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        const mb = (f.size / (1024 * 1024)).toFixed(1);
        errs.push(`${f.name} is ${mb}MB — max ${MAX_SIZE_MB}MB per photo`);
        continue;
      }
      toQueue.push({ file: f, objectUrl: URL.createObjectURL(f) });
    }

    if (errs.length) setError(errs.join('  ·  '));
    if (toQueue.length) setCropQueue(prev => [...prev, ...toQueue]);
    e.target.value = '';
  }

  // ── crop actions ────────────────────────────────────────────────────────────

  async function confirmCrop() {
    if (!cropSession) return;
    const pixels = croppedArea;
    try {
      let file: File;
      let objectUrl: string;
      if (pixels) {
        const blob = await getCroppedBlob(cropSession.entry.objectUrl, pixels, cropSession.entry.file.type);
        file      = new File([blob], cropSession.entry.file.name, { type: cropSession.entry.file.type });
        objectUrl = URL.createObjectURL(blob);
      } else {
        file      = cropSession.entry.file;
        objectUrl = cropSession.entry.objectUrl;
      }
      URL.revokeObjectURL(cropSession.entry.objectUrl);
      setImages(prev => [...prev, { id: uid(), file, objectUrl }]);
    } catch {
      setImages(prev => [...prev, { id: uid(), file: cropSession.entry.file, objectUrl: cropSession.entry.objectUrl }]);
    }
    setCropSession(null);
  }

  function cancelCrop() {
    if (!cropSession) return;
    URL.revokeObjectURL(cropSession.entry.objectUrl);
    cropQueue.forEach(e => URL.revokeObjectURL(e.objectUrl));
    setCropQueue([]);
    setCropSession(null);
  }

  // ── image management ────────────────────────────────────────────────────────

  function removeImage(id: string) {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.objectUrl);
      return prev.filter(i => i.id !== id);
    });
  }

  function clearAll() {
    images.forEach(i => URL.revokeObjectURL(i.objectUrl));
    setImages([]);
  }

  function setAsMain(id: string) {
    setImages(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx <= 0) return prev;
      const next = [...prev]; const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  }

  function moveLeft(id: string) {
    setImages(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx <= 0) return prev;
      const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveRight(id: string) {
    setImages(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  const onDragStart = useCallback((i: number) => { dragFrom.current = i; }, []);
  const onDragEnter = useCallback((i: number) => { dragTo.current = i; setDragOverIdx(i); }, []);
  const onDragEnd   = useCallback(() => {
    if (dragFrom.current !== null && dragTo.current !== null && dragFrom.current !== dragTo.current) {
      const from = dragFrom.current, to = dragTo.current;
      setImages(prev => {
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
    }
    dragFrom.current = null;
    dragTo.current   = null;
    setDragOverIdx(null);
  }, []);

  async function retryUpload(id: string) {
    const img = images.find(i => i.id === id);
    if (!img || img.publicUrl) return;
    if (!token) return;
    setImages(prev => prev.map(i => i.id === id ? { ...i, error: undefined, progress: 0 } : i));
    const ext  = img.file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    try {
      const publicUrl = await uploadFileWithProgress(img.file, path, pct =>
        setImages(prev => prev.map(i => i.id === id ? { ...i, progress: pct } : i)),
        token,
      );
      setImages(prev => prev.map(i => i.id === id ? { ...i, publicUrl, progress: undefined, error: undefined } : i));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setImages(prev => prev.map(i => i.id === id ? { ...i, progress: undefined, error: msg } : i));
    }
  }

  // ── submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError('You need to sign in before publishing a listing.');
      return;
    }

    setLoading(true);
    setError('');

    // Track uploaded URLs locally (React state may be stale mid-loop)
    const urlMap = new Map<string, string>();
    images.forEach(img => { if (img.publicUrl) urlMap.set(img.id, img.publicUrl); });

    const pending = images.filter(img => !img.publicUrl && !img.error);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.publicUrl) continue;
      if (img.error)     continue;

      const n = pending.indexOf(img) + 1;
      setUploadStatus(`Uploading photo ${n} of ${pending.length}…`);

      const ext  = img.file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      try {
        const publicUrl = await uploadFileWithProgress(img.file, path, pct =>
          setImages(prev => prev.map(j => j.id === img.id ? { ...j, progress: pct } : j)),
          token,
        );
        urlMap.set(img.id, publicUrl);
        setImages(prev => prev.map(j => j.id === img.id ? { ...j, publicUrl, progress: undefined } : j));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setImages(prev => prev.map(j => j.id === img.id ? { ...j, progress: undefined, error: msg } : j));
        setError(`Photo ${i + 1} failed: ${friendlyError(msg)} — use the retry button, then submit again.`);
        setLoading(false);
        setUploadStatus('');
        return;
      }
    }

    setUploadStatus('');

    // Collect URLs in display order
    const imageUrls = images.map(img => urlMap.get(img.id)).filter(Boolean) as string[];

    const body = {
      title,
      description,
      price: parseFloat(price),
      category,
      images: imageUrls,
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create listing');
      setSuccess('Your listing is now live on the marketplace!');
      images.forEach(img => URL.revokeObjectURL(img.objectUrl));
      setImages([]);
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
    } catch (err) {
      // Don't reset form — preserve title/description/price/category for retry
      setError(err instanceof Error
        ? err.message
        : 'Could not publish listing — your photos are saved, just try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ── crop modal (full-screen overlay) ─────────────────────────────────────────

  const queueRemaining = cropQueue.length;

  const CropModal = cropSession ? (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-safe py-3 bg-black/80">
        <button onClick={cancelCrop} className="text-white/70 hover:text-white text-sm font-medium py-1 px-3">
          Cancel
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">Edit Photo</p>
          {queueRemaining > 0 && (
            <p className="text-white/50 text-xs">{queueRemaining} more to crop after this</p>
          )}
        </div>
        <button
          onClick={confirmCrop}
          className="bg-[#F5A623] text-[#1B4332] font-black text-sm py-1.5 px-4 rounded-xl"
        >
          Use ✓
        </button>
      </div>

      {/* Cropper area */}
      <div className="relative flex-1">
        <Cropper
          image={cropSession.entry.objectUrl}
          crop={cropPos}
          zoom={cropZoom}
          aspect={cropAspect}
          onCropChange={setCropPos}
          onZoomChange={setCropZoom}
          onCropComplete={(_, pixels) => setCroppedArea(pixels)}
        />
      </div>

      {/* Controls */}
      <div className="bg-[#111] px-5 pt-4 pb-8">
        {/* Aspect ratio */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white/50 text-xs font-semibold w-14">Shape</span>
          <div className="flex gap-2">
            {([{ label: '1:1', value: 1 }, { label: '4:3', value: 4/3 }] as const).map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setCropAspect(opt.value)}
                className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-colors ${
                  cropAspect === opt.value
                    ? 'bg-[#F5A623] text-[#1B4332] border-[#F5A623]'
                    : 'border-white/20 text-white/60 hover:border-white/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs font-semibold w-14">Zoom</span>
          <input
            type="range" min={1} max={3} step={0.05} value={cropZoom}
            onChange={e => setCropZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#F5A623] h-1"
          />
          <span className="text-white/50 text-xs w-10 text-right tabular-nums">{cropZoom.toFixed(1)}×</span>
        </div>

        {/* File info */}
        <p className="text-white/30 text-[10px] mt-3 text-center truncate">
          {cropSession.entry.file.name} · {fmtFileSize(cropSession.entry.file.size)}
        </p>
      </div>
    </div>
  ) : null;

  // ── main render ───────────────────────────────────────────────────────────────

  const totalSlots   = MAX_IMAGES - images.length - (cropSession ? 1 : 0) - cropQueue.length;
  const isSubmitting = loading;
  const anyUploading = images.some(i => i.progress !== undefined);

  return (
    <>
      {CropModal}

      {/* ── Image preview modal ── */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.src}
            alt="Preview"
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl select-none"
            draggable={false}
            onClick={e => e.stopPropagation()}
          />
          <div className="flex items-center gap-3 mt-5" onClick={e => e.stopPropagation()}>
            {preview.index !== 0 && (
              <button
                onClick={() => { setAsMain(preview.id); setPreview(null); }}
                className="bg-[#F5A623] text-[#1B4332] font-black px-5 py-2.5 rounded-xl text-sm hover:bg-[#e09500] transition-colors"
              >
                ★ Set as Cover
              </button>
            )}
            <button
              onClick={() => { removeImage(preview.id); setPreview(null); }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setPreview(null)}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white md:bg-[#F4F6F8] py-0 md:py-10 pb-6 md:pb-16">
        <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6">

          <div className="mb-7 pt-6 md:pt-0">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Sell on Gyedi</p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Create a Listing</h1>
            <p className="text-gray-400 mt-1.5 text-sm md:text-base">Goes live on the marketplace immediately</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span className="whitespace-pre-line">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {success}{' '}
              <Link href="/marketplace" className="font-bold underline ml-1">View marketplace →</Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">

            {/* ── Photos ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  Photos
                  {images.length > 0 && (
                    <span className="text-[11px] font-bold bg-[#1B4332]/10 text-[#1B4332] px-2 py-0.5 rounded-full">
                      {images.length} of {MAX_IMAGES} max
                    </span>
                  )}
                  {images.length === 0 && (
                    <span className="text-gray-400 font-normal text-xs">optional — up to {MAX_IMAGES}</span>
                  )}
                </label>
                {images.length > 1 && (
                  <button type="button" onClick={clearAll}
                    className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              {uploadStatus && (
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#1B4332] bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <div className="w-3 h-3 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  {uploadStatus}
                </div>
              )}

              {images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      draggable={img.progress === undefined && !img.error}
                      onDragStart={() => onDragStart(i)}
                      onDragEnter={() => onDragEnter(i)}
                      onDragOver={e => e.preventDefault()}
                      onDragLeave={() => setDragOverIdx(null)}
                      onDrop={onDragEnd}
                      onDragEnd={onDragEnd}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-gray-50 shadow-sm transition-all ${
                        dragOverIdx === i ? 'border-[#F5A623] ring-2 ring-[#F5A623]/30 scale-95' : 'border-gray-100'
                      }`}
                    >

                      {/* Thumbnail — tap to preview */}
                      <button type="button"
                        onClick={() => setPreview({ src: img.objectUrl, id: img.id, index: i })}
                        title="Preview"
                        className="absolute inset-0 w-full h-full z-0 cursor-zoom-in">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.objectUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                      </button>

                      {/* MAIN badge / Set-as-cover button */}
                      {i === 0 ? (
                        <span className="absolute top-1.5 left-1.5 bg-[#F5A623] text-[#1B4332] text-[9px] font-black px-1.5 py-0.5 rounded-full shadow z-10 pointer-events-none">
                          COVER
                        </span>
                      ) : img.progress === undefined && !img.error && (
                        <button type="button" onClick={e => { e.stopPropagation(); setAsMain(img.id); }}
                          title="Set as cover"
                          className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-[#F5A623] text-white hover:text-[#1B4332] text-[9px] font-black px-1.5 py-0.5 rounded-full shadow z-10 transition-colors">
                          ★
                        </button>
                      )}

                      {/* Uploaded checkmark */}
                      {img.publicUrl && !img.error && img.progress === undefined && (
                        <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center z-10 pointer-events-none shadow">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}

                      {/* File size badge */}
                      <span className={`absolute bottom-6 left-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded z-10 pointer-events-none ${
                        img.file.size > WARN_SIZE_MB * 1024 * 1024
                          ? 'bg-amber-400/90 text-amber-900'
                          : 'bg-black/50 text-white'
                      }`}>
                        {fmtFileSize(img.file.size)}
                        {img.file.size > WARN_SIZE_MB * 1024 * 1024 && ' ⚠'}
                      </span>

                      {/* X remove — always visible */}
                      {!img.error && (
                        <button type="button" onClick={() => removeImage(img.id)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs leading-none z-10 transition-colors">
                          ×
                        </button>
                      )}

                      {/* Progress bar overlay */}
                      {img.progress !== undefined && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-5 z-10 pointer-events-none">
                          <div className="h-1 bg-white/30 rounded-full">
                            <div className="h-1 bg-[#F5A623] rounded-full transition-all duration-200"
                              style={{ width: `${img.progress}%` }} />
                          </div>
                          <p className="text-white text-[8px] text-center mt-0.5">{img.progress}%</p>
                        </div>
                      )}

                      {/* Error overlay + retry */}
                      {img.error && (
                        <div className="absolute inset-0 bg-red-900/85 flex flex-col items-center justify-center gap-1 z-20 p-1.5">
                          <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <p className="text-white/80 text-[8px] text-center leading-tight line-clamp-2 px-0.5">{img.error}</p>
                          <button type="button" onClick={() => retryUpload(img.id)}
                            className="mt-0.5 bg-white text-red-700 text-[9px] font-black px-3 py-0.5 rounded-full hover:bg-red-50 transition-colors">
                            Retry ↺
                          </button>
                        </div>
                      )}

                      {/* Reorder arrows */}
                      {img.progress === undefined && !img.error && (
                        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-1 z-10">
                          <button type="button" onClick={() => moveLeft(img.id)} disabled={i === 0}
                            className="w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded flex items-center justify-center text-[11px] transition-colors disabled:opacity-0">‹</button>
                          <button type="button" onClick={() => moveRight(img.id)} disabled={i === images.length - 1}
                            className="w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded flex items-center justify-center text-[11px] transition-colors disabled:opacity-0">›</button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add more slot */}
                  {totalSlots > 0 && (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-12 flex flex-col items-center gap-3 text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors group">
                  <div className="w-14 h-14 bg-gray-100 group-hover:bg-[#1B4332]/8 rounded-2xl flex items-center justify-center transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Click to add photos</p>
                    <p className="text-xs mt-0.5">JPG, PNG or WebP · Max {MAX_SIZE_MB}MB each · Crop before upload</p>
                  </div>
                </button>
              )}

              <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple className="hidden" onChange={handleFileChange} />
            </div>

            {/* ── Title ── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Title *</label>
              <input name="title" required maxLength={200} placeholder="e.g. iPhone 14 Pro Max 256GB"
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors" />
            </div>

            {/* ── Category ── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
              <select name="category" required value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors">
                <option value="" disabled>Select a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* ── Price ── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (GHS) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold select-none">GHS</span>
                <input name="price" type="number" required min="1" step="0.01" placeholder="0.00"
                  value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors" />
              </div>
            </div>

            {/* ── Description ── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Description *</label>
              <textarea name="description" required rows={5}
                placeholder="Describe your item — condition, what's included, any defects…"
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors" />
            </div>

            {/* ── Escrow notice ── */}
            <div className="bg-[#F5A623]/10 rounded-xl p-4 border border-[#F5A623]/20 flex items-start gap-3">
              <svg className="w-5 h-5 text-[#1B4332] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="text-sm font-bold text-[#1B4332]">Escrow Protected Sale</p>
                <p className="text-xs text-[#1B4332]/70 mt-0.5">Buyers pay into escrow. You get paid when they confirm receipt. Zero chargeback risk.</p>
              </div>
            </div>

            {/* ── Submit ── */}
            <button type="submit" disabled={isSubmitting || anyUploading}
              className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-50 text-white font-black py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2">
              {isSubmitting || anyUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {uploadStatus || 'Publishing…'}
                </>
              ) : 'Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
