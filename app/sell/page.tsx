'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORIES = ['Electronics', 'Fashion', 'Vehicles', 'Furniture', 'Services', 'Agriculture', 'Real Estate', 'Other'];

export default function SellPage() {
  const [token, setToken]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('gyedi_token'));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) { setError('Please log in first.'); return; }

    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const imagesRaw = (fd.get('images') as string).trim();
    const images = imagesRaw ? imagesRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

    const body = {
      title:       fd.get('title'),
      description: fd.get('description'),
      price:       parseFloat(fd.get('price') as string),
      category:    fd.get('category'),
      images,
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create listing');
      setSuccess(`Listing created! ID: ${data.listing.id}`);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (token === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🔐</p>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Login Required</h2>
          <p className="text-gray-500 mb-8">You need an account to list items on Gyedi.</p>
          <Link
            href="/login"
            className="block bg-[#1B4332] hover:bg-[#0F2B1F] text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            Log In or Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Create a Listing</h1>
          <p className="text-gray-500 mt-2 text-sm">Your item will be live on the marketplace immediately</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
            <input
              name="title"
              required
              maxLength={200}
              placeholder="e.g. iPhone 14 Pro Max 256GB"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
            <select
              name="category"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (GHS) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">GHS</span>
              <input
                name="price"
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Describe your item — condition, specs, what's included…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URLs</label>
            <textarea
              name="images"
              rows={3}
              placeholder="Paste image URLs, one per line"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1.5">Enter direct image URLs (e.g. from Imgur, Cloudinary). First URL becomes the main photo.</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-sm text-amber-800 font-medium">🔒 Escrow Protected</p>
            <p className="text-xs text-amber-700 mt-1">All sales through Gyedi are escrow-protected. Buyers pay into escrow and you&apos;re paid when they confirm receipt.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B4332] hover:bg-[#0F2B1F] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base"
          >
            {loading ? 'Publishing…' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
