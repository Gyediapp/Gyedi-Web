'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Electronics', 'Fashion', 'Vehicles', 'Furniture', 'Services', 'Agriculture', 'Real Estate', 'Other'];
const BUCKET = 'listings';
const MAX_IMAGES = 5;
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

type ImageItem =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; objectUrl: string };

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | string;
  category: string;
  images: string[];
  sellerId: string;
  status: string;
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [token,     setToken]     = useState<string | null>(null);
  const [listing,   setListing]   = useState<Listing | null>(null);
  const [images,    setImages]    = useState<ImageItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tok     = localStorage.getItem('gyedi_token');
    const userStr = localStorage.getItem('gyedi_user');
    setToken(tok);

    if (!tok) { setLoading(false); return; }

    fetch(`/api/listings/${id}`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(res => res.json())
      .then(data => {
        if (!data.listing) { setError('Listing not found.'); setLoading(false); return; }

        const user = userStr ? (() => { try { return JSON.parse(userStr); } catch { return null; } })() : null;
        if (user?.id && data.listing.sellerId !== user.id) {
          setError('You can only edit your own listings.');
          setLoading(false);
          return;
        }

        setListing(data.listing);
        setImages(data.listing.images.map((url: string) => ({ kind: 'existing' as const, url })));
        setLoading(false);
      })
      .catch(() => { setError('Failed to load listing.'); setLoading(false); });

    return () => {
      setImages(prev => {
        prev.forEach(img => { if (img.kind === 'new') URL.revokeObjectURL(img.objectUrl); });
        return prev;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

    const slots = MAX_IMAGES - images.length;
    const toAdd: ImageItem[] = valid.slice(0, slots).map(f => ({ kind: 'new', file: f, objectUrl: URL.createObjectURL(f) }));
    if (toAdd.length) setImages(prev => [...prev, ...toAdd]);
    e.target.value = '';
  }

  function removeImage(idx: number) {
    setImages(prev => {
      const item = prev[idx];
      if (item.kind === 'new') URL.revokeObjectURL(item.objectUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function setAsMain(idx: number) {
    if (idx === 0) return;
    setImages(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  }

  function moveLeft(idx: number) {
    if (idx === 0) return;
    setImages(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveRight(idx: number) {
    setImages(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function getImageSrc(img: ImageItem): string {
    return img.kind === 'existing' ? img.url : img.objectUrl;
  }

  async function uploadAndCollectUrls(currentImages: ImageItem[]): Promise<string[]> {
    const urls: string[] = [];
    for (const img of currentImages) {
      if (img.kind === 'existing') { urls.push(img.url); continue; }
      const ext  = img.file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, img.file, { contentType: img.file.type, upsert: false });

      if (upErr) throw new Error(`Could not upload ${img.file.name}: ${upErr.message}`);

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !listing) return;

    setSaving(true);
    setError('');

    const hasNew = images.some(img => img.kind === 'new');
    let imageUrls: string[] = [];

    if (hasNew) {
      setUploading(true);
      try {
        imageUrls = await uploadAndCollectUrls(images);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Image upload failed');
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    } else {
      imageUrls = images.map(img => img.kind === 'existing' ? img.url : '').filter(Boolean);
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
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save changes');
      setSuccess('Listing updated!');
      setTimeout(() => router.push(`/listing/${listing.id}`), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading / error states ── */
  if (loading) {
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
          <h2 className="text-2xl font-black text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-6 text-sm">You need to be logged in to edit a listing.</p>
          <Link href="/login" className="block bg-[#1B4332] text-white font-bold px-8 py-4 rounded-xl text-base">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-sm">
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/dashboard" className="text-[#1B4332] font-semibold hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-[#F4F6F8] py-10 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        <div className="flex items-center gap-3 mb-7">
          <Link href={`/listing/${listing.id}`} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest">Edit Listing</p>
            <h1 className="text-2xl font-black text-gray-900 truncate">{listing.title}</h1>
          </div>
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
            {success} Redirecting…
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">

          {/* ── Photos ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">
                Photos{' '}
                <span className="text-gray-400 font-normal">
                  {images.length > 0
                    ? `${images.length}/${MAX_IMAGES} · first is cover`
                    : `(up to ${MAX_IMAGES})`}
                </span>
              </label>
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    images.forEach(img => { if (img.kind === 'new') URL.revokeObjectURL(img.objectUrl); });
                    setImages([]);
                  }}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-sm">
                    {/* Click to set as main */}
                    <button
                      type="button"
                      onClick={() => setAsMain(i)}
                      title={i === 0 ? 'Cover photo' : 'Tap to set as cover'}
                      className="absolute inset-0 w-full h-full z-0"
                    >
                      <Image src={getImageSrc(img)} alt="" fill className="object-cover" unoptimized />
                    </button>

                    {/* MAIN / NEW badge */}
                    {(i === 0 || img.kind === 'new') && (
                      <span className={`absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow z-10 pointer-events-none ${
                        i === 0 ? 'bg-[#F5A623] text-[#1B4332]' : 'bg-[#1B4332] text-white'
                      }`}>
                        {i === 0 ? 'MAIN' : 'NEW'}
                      </span>
                    )}

                    {/* X remove */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
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
                        disabled={i === images.length - 1}
                        className="w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded flex items-center justify-center text-[11px] transition-colors disabled:opacity-0"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < MAX_IMAGES && (
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
                  <p className="font-bold text-sm">Add photos</p>
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
              defaultValue={listing.title}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
            />
          </div>

          {/* ── Category ── */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
            <select
              name="category"
              required
              defaultValue={listing.category}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                defaultValue={parseFloat(listing.price.toString())}
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
              defaultValue={listing.description}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
            />
          </div>

          {/* ── Submit ── */}
          <div className="flex gap-3">
            <Link
              href={`/listing/${listing.id}`}
              className="flex-1 border border-gray-200 text-gray-600 font-bold py-4 rounded-xl text-base text-center hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-50 text-white font-black py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
