'use client';

export default function BuyNowButton({
  sellerId,
  listingTitle,
  amount,
  description,
  deliveryDays,
  listingId,
}: {
  sellerId: string;
  listingTitle: string;
  amount: number;
  description?: string;
  deliveryDays?: number;
  listingId?: string;
}) {
  function handleBuy() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const params = new URLSearchParams({
      title:    listingTitle,
      amount:   amount.toString(),
      sellerId,
    });
    if (description)  params.set('description',  description);
    if (deliveryDays) params.set('deliveryDays',  deliveryDays.toString());
    if (listingId)    params.set('listingId',     listingId);
    window.location.href = `/escrow/create?${params.toString()}`;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleBuy}
        className="w-full bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black py-3.5 rounded-xl transition-colors text-base"
      >
        Buy with Gyedi Escrow →
      </button>
      <p className="text-white/50 text-xs text-center">
        Not signed in?{' '}
        <a href="/login" className="text-white/70 underline">Log in first</a>
      </p>
    </div>
  );
}
