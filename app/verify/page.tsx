'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API        = process.env.NEXT_PUBLIC_API_URL ?? 'https://gyedi-api-production.up.railway.app/api';
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'root';

const DOC_TYPES = [
  { id: 'ghana_card',      label: 'Ghana Card',       emoji: '🪪', hasBack: true  },
  { id: 'passport',        label: 'Passport',         emoji: '📘', hasBack: false },
  { id: 'voters_id',       label: "Voter's ID",       emoji: '🗳️', hasBack: true  },
  { id: 'drivers_licence', label: "Driver's Licence", emoji: '🚗', hasBack: true  },
];

type PhotoState = { file: File; url: string } | null;

async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.set('file', file);
  fd.set('upload_preset', 'gyedi_kyc');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error(`upload_failed: HTTP ${res.status} ${res.statusText}`);
  const data = await res.json() as { secure_url?: string };
  if (!data.secure_url) throw new Error('Upload succeeded but no URL returned.');
  return data.secure_url;
}

function PhotoInput({
  label, hint, icon, value, onChange,
}: {
  label: string; hint: string; icon: string;
  value: PhotoState; onChange: (p: PhotoState) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ file, url: URL.createObjectURL(file) });
    e.target.value = '';
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-xs text-gray-400 mb-3">{hint}</p>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#1B4332]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={label} className="w-full h-52 object-cover" />
          <button
            type="button"
            onClick={() => { onChange(null); ref.current?.click(); }}
            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm"
          >
            Retake
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full h-44 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#1B4332] bg-gray-50 hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-2 group"
        >
          <span className="text-4xl group-hover:scale-110 transition-transform">{icon}</span>
          <span className="text-sm font-semibold text-gray-500 group-hover:text-[#1B4332]">Tap to capture or upload</span>
        </button>
      )}
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const [step,          setStep]          = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [docType,       setDocType]       = useState<typeof DOC_TYPES[0] | null>(null);
  const [frontPhoto,    setFrontPhoto]    = useState<PhotoState>(null);
  const [backPhoto,     setBackPhoto]     = useState<PhotoState>(null);
  const [selfiePhoto,   setSelfiePhoto]   = useState<PhotoState>(null);
  const [fullName,      setFullName]      = useState('');
  const [dateOfBirth,   setDateOfBirth]   = useState('');
  const [documentNum,   setDocumentNum]   = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [uploadMsg,     setUploadMsg]     = useState('');
  const [error,         setError]         = useState('');
  const [done,          setDone]          = useState(false);

  const hasBack = docType?.hasBack ?? true;
  const totalSteps = hasBack ? 6 : 5;

  function stepLabel(s: number) {
    const labels: Record<number, string> = {
      1: 'Document Type',
      2: 'Front Photo',
      3: 'Back Photo',
      4: 'Selfie',
      5: hasBack ? 'Your Details' : 'Selfie',
      6: hasBack ? 'Review' : 'Review',
    };
    return labels[s] ?? '';
  }

  function nextStep() {
    if (step === 2 && !hasBack) { setStep(4); return; }
    setStep(s => (s + 1) as typeof step);
  }

  function prevStep() {
    if (step === 1) { router.back(); return; }
    if (step === 4 && !hasBack) { setStep(2); return; }
    setStep(s => (s - 1) as typeof step);
  }

  function canProceed() {
    if (step === 1) return !!docType;
    if (step === 2) return !!frontPhoto;
    if (step === 3) return !!backPhoto;
    if (step === 4) return !!selfiePhoto;
    if (step === 5) return fullName.trim().length >= 2;
    return true;
  }

  async function handleSubmit() {
    const token = localStorage.getItem('gyedi_token');
    if (!token) { router.push('/login'); return; }
    setSubmitting(true);
    setError('');
    try {
      setUploadMsg('Uploading front document…');
      const frontUrl = await uploadPhoto(frontPhoto!.file);

      let backUrl: string | null = null;
      if (hasBack && backPhoto) {
        setUploadMsg('Uploading back of document…');
        backUrl = await uploadPhoto(backPhoto.file);
      }

      let selfieUrl: string | null = null;
      if (selfiePhoto) {
        setUploadMsg('Uploading selfie…');
        selfieUrl = await uploadPhoto(selfiePhoto.file);
      }

      setUploadMsg('Submitting verification…');
      const res = await fetch(`${API}/users/kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          documentType:   docType!.id,
          documentFront:  frontUrl,
          documentBack:   backUrl,
          selfieUrl:      selfieUrl,
          fullName:       fullName.trim(),
          dateOfBirth:    dateOfBirth || null,
          documentNumber: documentNum.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Submission failed');
      }
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadMsg('');
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-5xl">🔍</div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Documents Submitted!</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-8">
            Your identity documents are under review. We'll notify you once verified — usually within 24 hours.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="bg-[#1B4332] text-white font-bold px-8 py-3.5 rounded-2xl text-sm hover:bg-[#0F2B1F] transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  // ── Step progress bar ───────────────────────────────────────────────────────
  const displayStep = step === 1 ? 1 : step;
  const progressPct = ((displayStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-[#1B4332] text-white px-4 pt-safe-top">
        <div className="flex items-center gap-3 py-4">
          <button onClick={prevStep} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs text-green-300 uppercase tracking-widest font-semibold">Identity Verification</p>
            <p className="font-bold text-sm mt-0.5">{stepLabel(step)}</p>
          </div>
          <span className="text-xs text-green-300 font-semibold">{step}/{totalSteps}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/20 rounded-full mb-1">
          <div className="h-1 bg-[#F5A623] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* ── Step 1: Document type ── */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Choose Document Type</h2>
            <p className="text-sm text-gray-500 mb-6">Select your government-issued ID for verification.</p>
            <div className="grid grid-cols-2 gap-3">
              {DOC_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setDocType(t); setFrontPhoto(null); setBackPhoto(null); setSelfiePhoto(null); nextStep(); }}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    docType?.id === t.id
                      ? 'border-[#1B4332] bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-4xl">{t.emoji}</span>
                  <span className="text-sm font-bold text-gray-800 text-center">{t.label}</span>
                  {!t.hasBack && <span className="text-[10px] text-gray-400 font-medium">Front only</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Front photo ── */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Front of {docType?.label}</h2>
            <PhotoInput
              label="Front side"
              hint="Lay your document flat. Ensure all text is visible and the image is not blurry."
              icon="📄"
              value={frontPhoto}
              onChange={setFrontPhoto}
            />
          </div>
        )}

        {/* ── Step 3: Back photo ── */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Back of {docType?.label}</h2>
            <PhotoInput
              label="Back side"
              hint="Flip your document and capture the back side clearly."
              icon="📄"
              value={backPhoto}
              onChange={setBackPhoto}
            />
          </div>
        )}

        {/* ── Step 4: Selfie ── */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Take a Selfie</h2>
            <p className="text-sm text-gray-500 mb-4">Hold your phone at arm's length. Face must be fully visible and well-lit.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-amber-700 font-medium">
                💡 Look directly at the camera. Remove sunglasses and hats.
              </p>
            </div>
            <PhotoInput
              label="Selfie photo"
              hint="Use the front-facing camera. Plain background preferred."
              icon="🤳"
              value={selfiePhoto}
              onChange={setSelfiePhoto}
            />
          </div>
        )}

        {/* ── Step 5: Personal details ── */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Your Details</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your details exactly as they appear on your document.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="As it appears on your document"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Document Number</label>
                <input
                  type="text"
                  value={documentNum}
                  onChange={e => setDocumentNum(e.target.value)}
                  placeholder="ID / Passport / Voter's card number"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition-all bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 6: Review & submit ── */}
        {step === 6 && (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Review & Submit</h2>
            <p className="text-sm text-gray-500 mb-5">Double-check your documents before submitting.</p>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Document type', value: docType?.label },
                { label: 'Full name',     value: fullName },
                { label: 'Date of birth', value: dateOfBirth || '—' },
                { label: 'Document #',   value: documentNum || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {frontPhoto && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Front</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={frontPhoto.url} alt="Front" className="w-full h-28 object-cover rounded-xl border border-gray-200" />
                </div>
              )}
              {backPhoto && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Back</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={backPhoto.url} alt="Back" className="w-full h-28 object-cover rounded-xl border border-gray-200" />
                </div>
              )}
              {selfiePhoto && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Selfie</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfiePhoto.url} alt="Selfie" className="w-full h-28 object-cover rounded-xl border border-gray-200" />
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-blue-700 leading-relaxed">
                🔒 Your documents are securely encrypted and only reviewed by Gyedi's compliance team. They will not be shared with third parties.
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* ── CTA ── */}
        {step > 1 && (
          <button
            onClick={step === 6 ? handleSubmit : nextStep}
            disabled={!canProceed() || submitting}
            className="mt-6 w-full bg-[#F5A623] text-[#1B4332] font-black py-4 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e09520] transition-colors shadow-lg shadow-[#F5A623]/30"
          >
            {submitting
              ? (uploadMsg || 'Uploading…')
              : step === 6
                ? 'Submit for Verification'
                : 'Continue →'}
          </button>
        )}
      </div>

    </div>
  );
}
