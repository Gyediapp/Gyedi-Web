'use client';
import { useState } from 'react';

const DELIVERY_LABELS: Record<string, { icon: string; label: string }> = {
  personal: { icon: '🚶', label: 'Personal Delivery' },
  pickup:   { icon: '🏪', label: 'Pickup Only' },
  courier:  { icon: '📦', label: 'Courier Service' },
  bus:      { icon: '🚌', label: 'Bus/Sprinter' },
  glovo:    { icon: '🛵', label: 'Glovo / Bolt Food' },
};

export default function BuyNowButton({
  sellerId,
  listingTitle,
  amount,
  description,
  deliveryDays,
  listingId,
  deliveryOptions,
}: {
  sellerId:        string;
  listingTitle:    string;
  amount:          number;
  description?:    string;
  deliveryDays?:   number;
  listingId?:      string;
  deliveryOptions?: string[];
}) {
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [showOptions,      setShowOptions]      = useState(false);

  const options = Array.isArray(deliveryOptions) ? deliveryOptions
    : typeof deliveryOptions === 'string'
    ? JSON.parse(deliveryOptions || '[]')
    : [];

  function handleBuy() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { window.location.href = '/login'; return; }

    try {
      const stored = localStorage.getItem('gyedi_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.kycStatus !== 'VERIFIED' && u.kycStatus !== 'APPROVED') {
          window.location.href = '/escrow/create';
          return;
        }
      }
    } catch {}

    // If delivery options exist and none selected, show picker
    if (options.length > 0 && !selectedDelivery) {
      setShowOptions(true);
      return;
    }

    const params = new URLSearchParams({
      title:    listingTitle,
      amount:   amount.toString(),
      sellerId,
    });
    if (description)      params.set('description',      description);
    if (deliveryDays)     params.set('deliveryDays',      deliveryDays.toString());
    if (listingId)        params.set('listingId',         listingId);
    if (selectedDelivery) params.set('deliveryOption',    selectedDelivery);
    window.location.href = `/escrow/create?${params.toString()}`;
  }

  return (
    <div className="space-y-3">
      {/* Delivery picker */}
      {showOptions && options.length > 0 && (
        <div className="bg-white/10 rounded-xl p-4 space-y-2">
          <p className="text-white text-xs font-bold uppercase tracking-wide mb-2">Select Delivery Method</p>
          {options.map((opt: string) => {
            const d = DELIVERY_LABELS[opt] ?? { icon: '📦', label: opt };
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedDelivery(opt)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  selectedDelivery === opt
                    ? 'bg-[#F5A623] text-[#1B4332]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span>{d.icon}</span>
                <span>{d.label}</span>
                {selectedDelivery === opt && <span className="ml-auto">✔</span>}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handleBuy}
        className="w-full bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black py-3.5 rounded-xl transition-colors text-base"
      >
        {selectedDelivery
          ? `Proceed with ${DELIVERY_LABELS[selectedDelivery]?.label ?? selectedDelivery} →`
          : 'Buy with Gyedi Escrow →'}
      </button>
      <p className="text-white/50 text-xs text-center">
        Not signed in?{' '}
        <a href="/login" className="text-white/70 underline">Log in first</a>
      </p>
    </div>
  );
}