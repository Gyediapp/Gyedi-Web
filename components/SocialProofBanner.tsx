'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  userCount: number;
  listingCount: number;
  dealCount: number;
  tradedGhs: number;
}

function AnimatedCount({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount]     = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const dur = 1600;
    const steps = 50;
    const step = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, dur / steps);
    return () => clearInterval(t);
  }, [visible, target]);

  const fmt = count >= 1_000_000
    ? `${(count / 1_000_000).toFixed(1)}M`
    : count >= 1_000
      ? `${(count / 1_000).toFixed(0)}K`
      : count.toString();

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl font-black text-white">
        {prefix}{fmt}{suffix}
      </p>
    </div>
  );
}

export default function SocialProofBanner({ userCount, listingCount, dealCount, tradedGhs }: Props) {
  const stats = [
    { label: 'Verified Users',   target: userCount,    prefix: '',      suffix: '+' },
    { label: 'Active Listings',  target: listingCount,  prefix: '',      suffix: '+' },
    { label: 'Completed Deals',  target: dealCount,     prefix: '',      suffix: '+' },
    { label: 'Safely Traded',    target: tradedGhs,     prefix: 'GHS ',  suffix: '+' },
  ];

  return (
    <section className="py-10 md:py-14 bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1B4332]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <AnimatedCount target={s.target} prefix={s.prefix} suffix={s.suffix} />
              <p className="text-white/50 text-xs sm:text-sm mt-1 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
