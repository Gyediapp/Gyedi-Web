'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const DEFAULT_CATEGORIES = ['Electronics', 'Fashion', 'Vehicles', 'Furniture', 'Services', 'Agriculture', 'Real Estate', 'Other'];
const BUCKET = 'listings';
const MAX_IMAGES = 5;
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

type Preview = { file: File; objectUrl: string; publicUrl?: string };

export default function SellPage() {
  const [token,      setToken]      = useState<string | null>(null);
  const [previews,   setPreviews]   = useState<Preview[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setToken(localStorage.getItem('gyedi_token'));
    fetch('/api/categories').then(r => r.json()).then(d => {
      if (Array.isArray(d.categories) && d.categories.length > 0) setCategories(d.categories);
    }).catch(() => {});
    return () => { previews.forEach(p => URL.revokeObjectURL(p.objectUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError('');

    const errs: string[] = [];
    const valid: File[] = [];
    for (const f of files) {
      if (!ALLOWED_TYPES.has(f.type)) { errs.push(`${f.name}: unsupported type (JPG, PNG or WebP only)`); continue; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { errs.push(`${f.name} is too large — max ${MAX_SIZE_MB} MB per photo`); continue; }
      valid.push(f);
    }
    if (errs.length) setError(errs.join(' · '));

    const slots = MAX_IMAGES - previews.length;
    const toAdd = valid.slice(0, slots).map(f => ({ file: f, objectUrl: URL.createObjectURL(f) }));
    if (toAdd.length) setPreviews(prev => [...prev, ...toAdd]);
    e.target.value = '';
  }

  function removePreview(idx: number) {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].objectUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function clearAll() {
    previews.forEach(p => URL.revokeObjectURL(p.objectUrl));
    setPreviews([]);
  }

  function setAsMain(idx: number) {
    if (idx === 0) return;
    setPreviews(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  }

  function moveLeft(idx: number) {
    if (idx === 0) return;
    setPreviews(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveRight(idx: number) {
    setPreviews(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  async function uploadAll(currentPreviews: Preview[]): Promise<string[]> {
    setUploading(true);
    const urls: string[] = [];

    for (const p of currentPreviews) {
      if (p.publicUrl) { urls.push(p.publicUrl); continue; }
      const ext  = p.file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, p.file, { contentType: p.file.type, upsert: false });

      if (upErr) {
        setUploading(false);
        throw new Error(`Could not upload ${p.file.name}: ${upErr.message}`);
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(publicUrl);
    }

    setUploading(false);
    return urls;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) { setError('Please log in first.'); return; }

    setLoading(true);
    setError('');

    let imageUrls: string[] = [];
    try {
      imageUrls = await uploadAll(previews);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
      setLoading(false);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const body = {
      title:       fd.get('title'),
      description: fd.get('description'),
      price:       parseFloat(fd.get('price') as string),
      category:    fd.get('category'),
      images:      imageUrls,
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
      setPreviews([]);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (token === null) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[#1B4332]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#1B4332]/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-8 text-sm">You need an account to list items on Gyedi.</p>
          <Link href="/login" className="block bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
            Log In or Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] py-10 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        <div className="mb-7">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Sell on Gyedi</p>
          <h1 className="text-3xl font-black text-gray-900">Create a Listing</h1>
          <p className="text-gray-400 mt-1.5">Goes live on the marketplace immediately</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {success}{' '}
            <Link href="/marketplace" className="font-bold underline">View marketplace →</Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">

          {/* ── Photos ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">
                Photos{' '}
                <span className="text-gray-400 font-normal">
                  {previews.length > 0
                    ? `${previews.length}/${MAX_IMAGES} · first is cover`
                    : `(up to ${MAX_IMAGES})`}
                </span>
              </label>
              {previews.length > 1 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {previews.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-sm">
                    {/* Full-area button to set as main cover */}
                    <button
                      type="button"
                      onClick={() => setAsMain(i)}
                      title={i === 0 ? 'Cover photo' : 'Tap to set as cover'}
                      className="absolute inset-0 w-full h-full z-0"
                    >
                      <Image src={p.objectUrl} alt="" fill className="object-cover" unoptimized />
                    </button>

                    {/* MAIN badge */}
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-[#F5A623] text-[#1B4332] text-[9px] font-black px-1.5 py-0.5 rounded-full shadow z-10 pointer-events-none">
                        MAIN
                      </span>
                    )}

                    {/* X remove */}
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs leading-none z-10 transition-colors"
                    >
                      ×
                    </button>

                    {/* Reorder arrows */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-1 z-10">
                      <button
                        type="button"
                        onClick={() => moveLeft(i)}
                        disabled={i === 0}
                        className="w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded flex items-center justify-center text-[11px] transition-colors disabled:opacity-0"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRight(i)}
                        disabled={i === previews.length - 1}
                        className="w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded flex items-center justify-center text-[11px] transition-colors disabled:opacity-0"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                ))}

                {previews.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-12 flex flex-col items-center gap-3 text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors group"
              >
                <div className="w-14 h-14 bg-gray-100 group-hover:bg-[#1B4332]/8 rounded-2xl flex items-center justify-center transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Click to add photos</p>
                  <p className="text-xs mt-0.5">JPG, PNG or WebP · Max {MAX_SIZE_MB} MB each</p>
                </div>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* ── Title ── */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Title *</label>
            <input
              name="title"
              required
              maxLength={200}
              placeholder="e.g. iPhone 14 Pro Max 256GB"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
            />
          </div>

          {/* ── Category ── */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
            <select
              name="category"
              required
              defaultValue=""
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
            >
              <option value="" disabled>Select a category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Price ── */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (GHS) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold select-none">GHS</span>
              <input
                name="price"
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
              />
            </div>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description *</label>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Describe your item — condition, what's included, any defects…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
            />
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
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-50 text-white font-black py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading photos…
              </>
            ) : loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing…
              </>
            ) : (
              'Publish Listing'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
