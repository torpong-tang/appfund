"use client";
import { useMemo, useRef, useState, useEffect } from 'react';

// Vibrant palette (bright, readable on the dark glass surface). Color is decorative
// identity — the data (contribution amount) is encoded by font size.
const PALETTE = ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24', '#fb7185', '#60a5fa', '#f472b6', '#4ade80', '#fdba74', '#c084fc', '#2dd4bf', '#f59e0b'];

// Word-cloud infographic: student IDs sized by total contribution and packed tightly.
export default function ContributorCloud({ contributors }) {
  const { placed, width, height } = useMemo(() => {
    if (!contributors || contributors.length === 0) return { placed: [], width: 0, height: 0 };

    const totals = contributors.map(c => c.total);
    const max = Math.max(...totals, 1), min = Math.min(...totals, 0);
    const FMIN = 15, FMAX = 56;
    const fontFor = t => (max === min ? (FMIN + FMAX) / 2 : Math.round(FMIN + ((t - min) / (max - min)) * (FMAX - FMIN)));

    // contributors arrive sorted desc → biggest word placed first at the center.
    const items = contributors.map((c, i) => {
      const label = String(c.memberId || c.name || '-');
      const fs = fontFor(c.total);
      // estimate the text box (generous factor to avoid overlap); digits are narrower than Thai text.
      const charW = /^\d+$/.test(label) ? 0.62 : 0.98;
      const w = label.length * fs * charW + 16;
      const h = fs * 1.32;
      return { ...c, label, fs, w, h, color: PALETTE[i % PALETTE.length] };
    });

    // Rectangle packing along an Archimedean spiral (AABB collision).
    const gap = 6;
    const out = [];
    for (const it of items) {
      if (out.length === 0) { it.cx = 0; it.cy = 0; out.push(it); continue; }
      let angle = 0, ok = false;
      while (!ok && angle < 1600) {
        const rad = 2.4 * angle;
        const cx = Math.cos(angle) * rad;
        const cy = Math.sin(angle) * rad * 0.62; // squash vertically → wider, word-cloud-like block
        const collide = out.some(o =>
          Math.abs(cx - o.cx) < (it.w + o.w) / 2 + gap &&
          Math.abs(cy - o.cy) < (it.h + o.h) / 2 + gap
        );
        if (!collide) { it.cx = cx; it.cy = cy; ok = true; out.push(it); }
        angle += 0.22;
      }
      if (!ok) { it.cx = 0; it.cy = 0; out.push(it); }
    }

    const minX = Math.min(...out.map(p => p.cx - p.w / 2)), maxX = Math.max(...out.map(p => p.cx + p.w / 2));
    const minY = Math.min(...out.map(p => p.cy - p.h / 2)), maxY = Math.max(...out.map(p => p.cy + p.h / 2));
    out.forEach(p => { p.left = p.cx - p.w / 2 - minX; p.top = p.cy - p.h / 2 - minY; });
    return { placed: out, width: maxX - minX, height: maxY - minY };
  }, [contributors]);

  // Scale to fit narrow screens.
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !width) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  if (placed.length === 0) return null;

  return (
    <section className="glass-panel p-6 md:p-8 max-w-5xl mx-auto mb-8 text-white fade-up" style={{ animationDelay: '270ms' }}>
      <h2 className="text-lg md:text-xl font-black flex items-center gap-3 mb-5">
        <i className="fas fa-hand-holding-heart text-emerald-300"></i> ผู้ร่วมสมทบทุน
        <span className="text-xs font-medium text-slate-400">(รหัสนักศึกษา · ขนาดตามยอดรวมที่โอน · {placed.length} คน)</span>
      </h2>

      <div ref={wrapRef} className="w-full flex justify-center">
        <div style={{ width: width * scale, height: height * scale }}>
          <div className="relative" style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {placed.map((c, i) => (
              <div
                key={c.label + i}
                className="group absolute flex items-center justify-center font-black leading-none cursor-default select-none transition-transform duration-200 hover:scale-110"
                style={{ left: c.left, top: c.top, width: c.w, height: c.h, fontSize: c.fs, color: c.color, textShadow: '0 1px 10px rgba(0,0,0,0.45)' }}
                title={`${c.total.toLocaleString()} บาท`}
              >
                {c.label}
                <span className="absolute left-1/2 -translate-x-1/2 -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none z-40 shadow-xl">
                  <span className="text-emerald-300">{c.total.toLocaleString()}</span> บาท
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
