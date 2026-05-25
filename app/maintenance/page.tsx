export default function MaintenancePage({ searchParams }: { searchParams: { message?: string } }) {
  const message = searchParams?.message || 'We are performing scheduled maintenance. Please check back soon.';

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
          <div className="text-6xl mb-6">🔧</div>
          <h1 className="text-2xl font-black text-[#1B4332] mb-2">Under Maintenance</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5A623]">
            <span className="text-2xl font-black">Gyedi</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Secure Escrow Platform</p>
        </div>
      </div>
    </div>
  );
}
