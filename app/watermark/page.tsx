'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

const POSITIONS = [
  { id: 'top-left',      label: 'Top Left' },
  { id: 'top-center',    label: 'Top Center' },
  { id: 'top-right',     label: 'Top Right' },
  { id: 'center',        label: 'Center' },
  { id: 'bottom-left',   label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right',  label: 'Bottom Right' },
];

const FONTS = [
  'Arial', 'Georgia', 'Impact', 'Trebuchet MS', 'Verdana',
];

export default function WatermarkPage() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);
  const [image,      setImage]      = useState<HTMLImageElement | null>(null);
  const [imageName,  setImageName]  = useState('');
  const [text,       setText]       = useState('© Gyedi Protected');
  const [position,   setPosition]   = useState('bottom-right');
  const [opacity,    setOpacity]    = useState(70);
  const [fontSize,   setFontSize]   = useState(24);
  const [color,      setColor]      = useState('#ffffff');
  const [font,       setFont]       = useState('Arial');
  const [bold,       setBold]       = useState(true);
  const [shadow,     setShadow]     = useState(true);
  const [tiled,      setTiled]      = useState(false);
  const [ready,      setReady]      = useState(false);

  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.drawImage(image, 0, 0);

    ctx.globalAlpha = opacity / 100;
    ctx.font        = `${bold ? 'bold' : 'normal'} ${fontSize}px ${font}`;
    ctx.fillStyle   = color;

    if (shadow) {
      ctx.shadowColor   = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur    = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur  = 0;
    }

    const metrics  = ctx.measureText(text);
    const tw       = metrics.width;
    const th       = fontSize;
    const pad      = 20;
    const w        = canvas.width;
    const h        = canvas.height;

    if (tiled) {
      const spacingX = tw + 80;
      const spacingY = th + 60;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 6);
      for (let y = -h; y < h * 2; y += spacingY) {
        for (let x = -w; x < w * 2; x += spacingX) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
    } else {
      let x = pad;
      let y = pad + th;

      switch (position) {
        case 'top-left':      x = pad;           y = pad + th;          break;
        case 'top-center':    x = w/2 - tw/2;    y = pad + th;          break;
        case 'top-right':     x = w - tw - pad;  y = pad + th;          break;
        case 'center':        x = w/2 - tw/2;    y = h/2 + th/2;        break;
        case 'bottom-left':   x = pad;           y = h - pad;           break;
        case 'bottom-center': x = w/2 - tw/2;    y = h - pad;           break;
        case 'bottom-right':  x = w - tw - pad;  y = h - pad;           break;
      }
      ctx.fillText(text, x, y);
    }

    ctx.globalAlpha = 1;
    setReady(true);
  }, [image, text, position, opacity, fontSize, color, font, bold, shadow, tiled]);

  useEffect(() => {
    drawWatermark();
  }, [drawWatermark]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImage(img); setReady(false); };
    img.src    = url;
    e.target.value = '';
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link      = document.createElement('a');
    const ext       = imageName.split('.').pop() ?? 'jpg';
    link.download   = `watermarked-${imageName || 'image.' + ext}`;
    link.href       = canvas.toDataURL(`image/${ext === 'png' ? 'png' : 'jpeg'}`, 0.95);
    link.click();
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#1B4332] to-[#0F2B1F] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <Link href="/profile" className="inline-flex items-center gap-1.5 text-green-400 text-sm hover:text-white transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white">Image Watermark Tool</h1>
          <p className="text-green-300/70 text-sm mt-1">Protect your product photos from being stolen</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Left — Controls */}
          <div className="space-y-4">

            {/* Upload */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
              <h3 className="font-black text-white text-sm mb-3">1. Upload Image</h3>
              {image ? (
                <div className="flex items-center justify-between bg-[#0F172A] rounded-xl px-4 py-3">
                  <span className="text-sm text-white/60 truncate">{imageName}</span>
                  <button
                    onClick={() => { setImage(null); setImageName(''); setReady(false); }}
                    className="text-red-400 hover:text-red-300 text-xs font-bold ml-3 flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-white/20 hover:border-[#F5A623]/50 rounded-xl py-8 flex flex-col items-center gap-2 text-white/40 hover:text-[#F5A623] transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold">Click to upload JPG or PNG</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFile} />
            </div>

            {/* Watermark Text */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
              <h3 className="font-black text-white text-sm mb-3">2. Watermark Text</h3>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={60}
                placeholder="e.g. © Your Store Name"
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>

            {/* Style */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="font-black text-white text-sm">3. Style</h3>

              {/* Font */}
              <div>
                <label className="text-xs text-white/50 font-semibold block mb-1.5">Font</label>
                <select
                  value={font}
                  onChange={e => setFont(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]/50"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Font size */}
              <div>
                <label className="text-xs text-white/50 font-semibold block mb-1.5">
                  Font Size — {fontSize}px
                </label>
                <input
                  type="range" min={12} max={80} value={fontSize}
                  onChange={e => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-[#F5A623]"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="text-xs text-white/50 font-semibold block mb-1.5">
                  Opacity — {opacity}%
                </label>
                <input
                  type="range" min={10} max={100} value={opacity}
                  onChange={e => setOpacity(parseInt(e.target.value))}
                  className="w-full accent-[#F5A623]"
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-xs text-white/50 font-semibold block mb-1.5">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color" value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                  />
                  {['#ffffff', '#000000', '#F5A623', '#1B4332', '#ff0000'].map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-[#F5A623] scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setBold(v => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${bold ? 'bg-[#F5A623] text-[#1B4332]' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  Bold
                </button>
                <button
                  onClick={() => setShadow(v => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${shadow ? 'bg-[#F5A623] text-[#1B4332]' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  Shadow
                </button>
                <button
                  onClick={() => setTiled(v => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tiled ? 'bg-[#F5A623] text-[#1B4332]' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  Tiled Pattern
                </button>
              </div>
            </div>

            {/* Position */}
            {!tiled && (
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
                <h3 className="font-black text-white text-sm mb-3">4. Position</h3>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-colors ${
                        position === p.id
                          ? 'bg-[#F5A623] text-[#1B4332]'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Preview + Download */}
          <div className="space-y-4">
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
              <h3 className="font-black text-white text-sm mb-3">Preview</h3>
              {!image ? (
                <div className="aspect-square bg-[#0F172A] rounded-xl flex items-center justify-center">
                  <p className="text-white/20 text-sm">Upload an image to preview</p>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-xl border border-white/5"
                  style={{ maxHeight: '500px', objectFit: 'contain' }}
                />
              )}
            </div>

            {image && ready && (
              <button
                onClick={handleDownload}
                className="w-full bg-[#F5A623] hover:bg-[#D4881A] text-[#1B4332] font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Watermarked Image
              </button>
            )}

            {/* Tips */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-2">Tips</p>
              <ul className="space-y-1.5 text-xs text-white/40">
                <li>• Use your store name or phone number as watermark text</li>
                <li>• Tiled pattern gives maximum protection</li>
                <li>• White text with shadow works on most images</li>
                <li>• 50-70% opacity keeps image looking clean</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
