"use client";

// Tinted glass stat card used on the dashboard. `tone` selects the color scheme;
// `value` is a number rendered with thousands separators. Pass `onClick` to make it interactive.
const TONES = {
  green: { card: "glass-card-green", label: "text-emerald-100", suffix: "text-emerald-100/70" },
  red: { card: "glass-card-red", label: "text-rose-100", suffix: "text-rose-100/70" },
  sky: { card: "glass-card-sky", label: "text-cyan-100", suffix: "text-cyan-100/70" },
};

export default function StatCard({ label, value, tone, suffix = "Baht", onClick }) {
  const t = TONES[tone];
  // Only show clickable affordances (pointer + hover lift) when an onClick is provided.
  const interactive = onClick
    ? "cursor-pointer transition-transform duration-300 hover:-translate-y-1.5"
    : "";
  return (
    <div onClick={onClick} className={`glass-panel ${t.card} p-6 ${interactive}`}>
      <p className={`text-xs ${t.label} uppercase tracking-widest mb-1 opacity-80 font-bold`}>{label}</p>
      <p className="text-4xl font-black drop-shadow-md">{value.toLocaleString()}</p>
      <p className={`text-[10px] ${t.suffix} mt-1 uppercase`}>{suffix}</p>
    </div>
  );
}
