'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';

interface BoostPkg {
  id: string; name: string; slug: string; price: number; durationDays: number; description: string; badge: string;
}

interface ActiveBoost {
  id: string; boostType: string; endDate: string; packageName: string; badge: string;
}

export default function BoostButton({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const [show,    setShow]    = useState(false);
  const [open,    setOpen]    = useState(false);
  const [pkgs,    setPkgs]    = useState<BoostPkg[]>([]);
  const [active,  setActive]  = useState<ActiveBoost | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked,  setPicked]  = useState<string | null>(null);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    try {
      const token = localStorage.getItem('gyedi_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.sub === sellerId) setShow(true);
    } catch {}
  }, [sellerId]);

  useEffect(() => {
    if (!show) return;
    fetch(`${API}/boost/${listingId}/status`)
      .then(r => r.json())
      .then(d => setActive(d.boost))
      .catch(() => {});
    fetch(`${API}/boost-packages`)
      .then(r => r.json())
      .then(d => { setPkgs(d.packages ?? []); if (d.packages?.[0]) setPicked(d.packages[0].id); })
      .catch(() => {});
  }, [show, listingId]);

  async function handleBoost() {
    if (!picked) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('gyedi_token');
      const res = await fetch(`${API}/boost/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: picked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Boost failed');
      setSuccess(data.message ?? 'Listing boosted!');
      setOpen(false);
      setActive({ id: data.boost.id, boostType: data.boost.boostType, endDate: data.boost.endDate, packageName: '', badge: '' });
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <>
      {active ? (
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          ⚡ Boosted until {new Date(active.endDate).toLocaleDateString()}
        </div>
      ) : (
        <button
          onClick={() => { setOpen(true); setError(''); setSuccess(''); }}
          className="inline-flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] text-xs font-black px-3 py-1.5 rounded-full transition-colors"
        >
          ⚡ Boost Listing
        </button>
      )}

      {success && (
        <span className="ml-2 text-green-600 text-xs font-semibold">{success}</span>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="bg-[#1B4332] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-black text-lg">⚡ Boost This Listing</h3>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-4">Push your listing to the top. More views = more sales.</p>
              <div className="space-y-3">
                {pkgs.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setPicked(pkg.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      picked === pkg.id ? 'border-[#F5A623] bg-amber-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{pkg.badge} {pkg.name}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{pkg.description} · {pkg.durationDays} days</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-black text-[#1B4332]">GHS {pkg.price}</p>
                    </div>
                  </button>
                ))}
              </div>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm">Cancel</button>
                <button
                  onClick={handleBoost}
                  disabled={loading || !picked}
                  className="flex-1 bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Boosting...' : 'Boost Now →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
