import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function PrivacyPage() {
  let title = 'Privacy Policy';
  let body  = 'Privacy policy content coming soon.';

  try {
    const rows = await (prisma as any).$queryRawUnsafe(
  `SELECT title, body FROM legal_pages WHERE slug = $1`, 'privacy'
);
const page = (rows as any[])[0] ?? null;
    if (page) { title = page.title; body = page.body; }
  } catch {}

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <div className="relative bg-[#1B4332] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white">{title}</h1>
          <p className="text-green-300/70 text-sm mt-1">Last updated: {new Date().toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <div className="prose prose-sm sm:prose max-w-none text-gray-600 leading-relaxed">
            {body.split('\n\n').map((para, i) => {
              if (para.startsWith('## ')) {
                return <h2 key={i} className="text-lg font-black text-gray-900 mt-6 mb-2">{para.replace('## ', '')}</h2>;
              }
              if (para.startsWith('# ')) {
                return <h1 key={i} className="text-xl font-black text-gray-900 mt-6 mb-2">{para.replace('# ', '')}</h1>;
              }
              return <p key={i} className="mb-4 last:mb-0">{para}</p>;
            })}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link href="/terms" className="text-[#1B4332] font-semibold hover:underline">Terms of Service</Link>
          <span className="text-gray-300">·</span>
          <Link href="/" className="text-gray-400 hover:text-gray-600">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}