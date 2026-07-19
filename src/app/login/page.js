"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader } from 'lucide-react';
import ContributorCloud from '@/components/ContributorCloud';
import { api, apiJson } from '@/lib/api';

/* Colorful progress donut (achieved vs remaining toward the goal). */
function DonutChart({ percent, balance }) {
  const R = 80;
  const C = 2 * Math.PI * R;
  const dash = (Math.min(100, Math.max(0, percent)) / 100) * C;
  return (
    <svg viewBox="0 0 200 200" className="w-52 h-52 md:w-60 md:h-60" role="img" aria-label={`ความคืบหน้า ${percent.toFixed(1)} เปอร์เซ็นต์`}>
      <defs>
        <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="45%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="donutGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="20" />
      <circle
        cx="100" cy="100" r={R} fill="none" stroke="url(#donutGrad)" strokeWidth="20" strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`} transform="rotate(-90 100 100)" filter="url(#donutGlow)"
        style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <text x="100" y="94" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="800">{percent.toFixed(1)}%</text>
      <text x="100" y="120" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="12">ยอดปัจจุบัน</text>
      <text x="100" y="140" textAnchor="middle" fill="#6ee7b7" fontSize="17" fontWeight="700">{balance.toLocaleString()}</text>
    </svg>
  );
}

/* Decorative banknote + coins illustration. */
function MoneyArt({ className = "" }) {
  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden="true">
      {/* coins pile */}
      <ellipse cx="150" cy="120" rx="34" ry="10" fill="#f59e0b" opacity="0.9" />
      <ellipse cx="150" cy="112" rx="34" ry="10" fill="#fbbf24" />
      <ellipse cx="150" cy="104" rx="34" ry="10" fill="#f59e0b" opacity="0.9" />
      <ellipse cx="150" cy="96" rx="34" ry="10" fill="#fcd34d" />
      <text x="150" y="100" textAnchor="middle" fill="#92400e" fontSize="12" fontWeight="800">฿</text>
      {/* stacked banknotes (rotated) */}
      <g transform="rotate(-12 70 70)">
        <rect x="18" y="52" width="112" height="60" rx="9" fill="#0ea5e9" />
        <rect x="14" y="44" width="112" height="60" rx="9" fill="#22d3ee" />
        <rect x="10" y="36" width="112" height="60" rx="9" fill="#34d399" />
        <circle cx="66" cy="66" r="17" fill="rgba(255,255,255,0.35)" />
        <text x="66" y="72" textAnchor="middle" fill="#065f46" fontSize="18" fontWeight="800">฿</text>
        <rect x="20" y="46" width="18" height="7" rx="3.5" fill="rgba(255,255,255,0.5)" />
        <rect x="96" y="80" width="18" height="7" rx="3.5" fill="rgba(255,255,255,0.5)" />
      </g>
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  // If already logged in, go straight to the dashboard.
  useEffect(() => {
    apiJson('/api/auth/me').then(d => { if (d && !d.error) router.replace('/'); }).catch(() => {});
    apiJson('/api/public/summary').then(d => { if (d && !d.error) setSummary(d); }).catch(() => {});
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(api('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');

      const sessionRes = await fetch(api('/api/auth/me'), {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!sessionRes.ok) {
        throw new Error('สร้าง session ไม่สำเร็จ กรุณาลองเข้าสู่ระบบอีกครั้ง');
      }

      window.location.assign(api(''));
    } catch (err) {
      setError(err.name === 'AbortError' ? 'ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองอีกครั้ง' : err.message);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  const s = summary || { balance: 0, remaining: 0, target: 0, percent: 0, title: 'AppFund', subtitle: '', latestTimestamp: null, contributors: [] };
  const latest = s.latestTimestamp ? new Date(s.latestTimestamp) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 text-white font-sans">
      <div className="w-full max-w-5xl flex flex-wrap items-stretch justify-center gap-6 fade-up">

        {/* ---------- Hero + data ---------- */}
        <div className="glass-panel relative overflow-hidden rounded-[2rem] p-8 md:p-10 w-full md:w-[calc(50%-0.75rem)] order-1">
          {/* decorative money art */}
          <MoneyArt className="absolute -top-6 -right-8 w-56 opacity-25 rotate-6 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-white/30 to-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/40">
                <i className="fas fa-ship"></i>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black leading-tight">{s.title}</h1>
                {s.subtitle && <p className="text-xs text-violet-200/70">{s.subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-emerald-300 font-bold text-sm">
              <i className="fas fa-bullseye"></i> เป้าหมายรายรับของกองทุน
            </div>

            {/* Donut */}
            <div className="flex justify-center mb-6">
              <DonutChart percent={s.percent} balance={s.balance} />
            </div>

            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {[
                { label: 'ยอดปัจจุบัน', value: s.balance, dot: 'bg-emerald-400', text: 'text-emerald-300' },
                { label: 'คงเหลืออีก', value: s.remaining, dot: 'bg-amber-400', text: 'text-amber-300' },
                { label: 'เป้าหมาย', value: s.target, dot: 'bg-violet-400', text: 'text-violet-300' },
              ].map(c => (
                <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl px-2 py-3 text-center">
                  <p className="text-[10px] text-slate-400 mb-1 flex items-center justify-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>{c.label}
                  </p>
                  <p className={`text-sm md:text-base font-black ${c.text}`}>{Number(c.value).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {latest && (
              <p className="mt-4 text-[11px] text-slate-300/70 flex items-center gap-2">
                <i className="fas fa-clock-rotate-left text-indigo-300"></i>
                รายการเดินบัญชีล่าสุด: <span className="font-bold text-white">{latest.toLocaleDateString('th-TH')} {latest.toLocaleTimeString('th-TH')}</span>
              </p>
            )}
          </div>
        </div>

        {/* ---------- Contributor word-cloud (public) — sits between hero and login on mobile ---------- */}
        {s.contributors && s.contributors.length > 0 && (
          <div className="w-full order-2 md:order-3">
            <ContributorCloud contributors={s.contributors} />
          </div>
        )}

        {/* ---------- Login (moves to the bottom on mobile via order) ---------- */}
        <div className="glass-panel rounded-[2rem] p-8 md:p-10 w-full md:w-[calc(50%-0.75rem)] flex flex-col justify-center order-3 md:order-2">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight">เข้าสู่ระบบผู้ดูแล</h2>
            <p className="text-sm text-slate-300/70 mt-1">สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2 font-bold">อีเมล</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"><Mail size={18} /></span>
                <input
                  type="email" required autoFocus
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl"
                  placeholder="Administrator Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 font-bold">รหัสผ่าน</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"><Lock size={18} /></span>
                <input
                  type={showPassword ? 'text' : 'password'} required
                  className="glass-input w-full pl-10 pr-11 py-3 rounded-xl"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/15 border border-red-500/40 text-red-200 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="cursor-pointer glow-violet mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-all duration-300"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : <LogIn size={20} />}
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
