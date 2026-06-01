import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

export const NAV = [
  { id: "dashboard",  label: "Dashboard",  icon: "LayoutDashboard" },
  { id: "semesters",  label: "Semesters",  icon: "BookOpen" },
  { id: "attendance", label: "Attendance", icon: "CalendarCheck2" },
  { id: "calculator", label: "Grades",     icon: "Calculator" },
  { id: "profile",    label: "Profile",    icon: "User" },
];

export const ACCENTS = {
  indigo:  "#6366f1",
  violet:  "#8b5cf6",
  emerald: "#10b981",
  rose:    "#f43f5e",
  amber:   "#f59e0b",
};

export function attTone(pct, target) {
  if (pct < target) return "red";
  if (pct < Math.min(100, target + 10)) return "yellow";
  return "green";
}

export const RECENT_ICON = {
  PYQ: "FileText", Pyq: "FileText", Playlist: "PlaySquare", Notes: "NotebookPen", Link: "Link", Other: "Paperclip",
};
export const RECENT_TONE = {
  PYQ: "pyq", Pyq: "pyq", Playlist: "playlist", Notes: "notes", Link: "link", Other: "other",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCountUp(target, { duration = 900, delay = 0, decimals = 0 } = {}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    const t0 = performance.now() + delay;
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const tick = (now) => {
      if (now < t0) { raf = requestAnimationFrame(tick); return; }
      if (start == null) start = now;
      const p = Math.min(1, (now - start) / duration);
      setVal(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return decimals === 0 ? Math.round(val) : Number(val.toFixed(decimals));
}

export function useLoaded(delay = 700) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), delay); return () => clearTimeout(t); }, [delay]);
  return ready;
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

export function Icon({ name, size = 16, className = '', strokeWidth = 1.75 }) {
  const Comp = LucideIcons[name];
  if (!Comp) return <span style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }} />;
  return <Comp size={size} strokeWidth={strokeWidth} className={className} style={{ display: 'inline-flex', flexShrink: 0 }} />;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

export function Card({ className = "", children, ...rest }) {
  return (
    <div className={className} style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px" }} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral:  "bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300",
    pyq:      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    playlist: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    notes:    "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
    link:     "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    other:    "bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300",
    green:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:    "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
    red:      "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    accent:   "bg-[var(--accent)]/10 text-[var(--accent)]",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-medium tracking-wide ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, className = "" }) {
  return (
    <div className={`h-1 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-white/[0.06] ${className}`}>
      <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-1000 ease-out" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Ring({ value, size = 44, stroke = 3.5, color = "var(--accent)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-neutral-200 dark:text-white/[0.08]" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1000ms cubic-bezier(.22,1,.36,1)" }} />
    </svg>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200/70 dark:bg-white/[0.06] ${className}`} />;
}

export function Button({ variant = "default", size = "sm", className = "", children, ...rest }) {
  const sizes = { sm: "h-8 px-2.5 text-[12px]", md: "h-9 px-3 text-[13px]", icon: "h-8 w-8" };
  const variants = {
    default: "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm",
    outline: "border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 dark:hover:bg-white/[0.06]",
    ghost:   "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-neutral-100",
    accent:  "bg-[var(--accent)] text-white hover:opacity-90 shadow-sm",
  };
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Tabs({ items, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-md border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50 dark:bg-white/[0.03] p-0.5 ${className}`}>
      {items.map((it) => {
        const id    = typeof it === 'string' ? it : (it.id    ?? it.label ?? '');
        const label = typeof it === 'string' ? it : (it.label ?? it.id    ?? '');
        const icon  = typeof it === 'string' ? undefined : it.icon;
        const badge = typeof it === 'string' ? undefined : it.badge;
        const isActive = value === id;
        return (
          <button key={id} onClick={() => onChange(id)} className={`relative inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[12px] font-medium transition-colors ${isActive ? "bg-white text-neutral-900 shadow-sm dark:bg-white/[0.08] dark:text-white" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"}`}>
            {icon && <Icon name={icon} size={12} />}
            {label}
            {badge != null && (
              <span className={`ml-0.5 rounded px-1 text-[10px] tabular-nums ${isActive ? "bg-neutral-100 text-neutral-600 dark:bg-white/[0.08] dark:text-neutral-300" : "bg-neutral-200/70 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400"}`}>{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Sheet({ open, onClose, title, children, width = 420 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div onClick={onClose} className="absolute inset-0 bg-neutral-900/60 dark:bg-black/70 backdrop-blur-[2px]" />
      <div style={{ width: `min(${width}px, calc(100vw - 32px))`, maxHeight: "90vh" }} className="relative z-10 flex flex-col bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] px-5">
          <h2 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{title}</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]">
            <Icon name="X" size={14} />
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 56px)" }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "OK", danger = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div onClick={onCancel} className="absolute inset-0 bg-neutral-900/60 dark:bg-black/70 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-neutral-950 shadow-2xl p-6">
        <h3 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{title}</h3>
        {message && <p className="mt-1.5 text-[12.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{message}</p>}
        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center justify-center h-8 px-3 rounded-md text-[12px] font-medium text-white transition-colors ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[var(--accent)] hover:opacity-90"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ onRetry, title = "Something went wrong", body = "Check your connection and try again." }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 dark:bg-rose-500/[0.08] text-rose-500 dark:text-rose-400">
        <Icon name="WifiOff" size={20} />
      </div>
      <h3 className="mt-4 text-[14px] font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 max-w-[280px] text-[12.5px] text-neutral-500 dark:text-neutral-400">{body}</p>
      {onRetry && <div className="mt-4"><Button variant="outline" onClick={onRetry}><Icon name="RotateCcw" size={12} /> Retry</Button></div>}
    </div>
  );
}

export function EmptyState({ icon = "stack", title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <EmptySvg kind={icon} />
      <h3 className="mt-5 text-[14px] font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">{title}</h3>
      {body && <p className="mt-1 max-w-[300px] text-[12.5px] text-neutral-500 dark:text-neutral-400">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function EmptySvg({ kind }) {
  const stroke = "currentColor";
  const sw = 1.25;
  if (kind === "stack") {
    return (
      <svg width="88" height="72" viewBox="0 0 88 72" fill="none" className="text-neutral-300 dark:text-neutral-700">
        <rect x="10.5" y="28.5" width="55" height="36" rx="4" stroke={stroke} strokeWidth={sw} />
        <rect x="16.5" y="18.5" width="55" height="36" rx="4" stroke={stroke} strokeWidth={sw} fill="white" className="dark:fill-neutral-950" />
        <rect x="22.5" y="8.5"  width="55" height="36" rx="4" stroke={stroke} strokeWidth={sw} fill="white" className="dark:fill-neutral-950" />
        <line x1="30" y1="20" x2="62" y2="20" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1="30" y1="28" x2="55" y2="28" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1="30" y1="36" x2="48" y2="36" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "calendar") {
    return (
      <svg width="80" height="72" viewBox="0 0 80 72" fill="none" className="text-neutral-300 dark:text-neutral-700">
        <rect x="10.5" y="14.5" width="59" height="50" rx="5" stroke={stroke} strokeWidth={sw} />
        <path d="M10.5 26.5h59" stroke={stroke} strokeWidth={sw} />
        <path d="M22 9v10M58 9v10" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <circle cx="26" cy="38" r="2" fill={stroke} />
        <circle cx="40" cy="38" r="2" fill={stroke} />
        <circle cx="54" cy="38" r="2" fill={stroke} />
        <circle cx="26" cy="50" r="2" fill={stroke} />
        <rect x="36" y="46" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.6" />
        <circle cx="54" cy="50" r="2" fill={stroke} />
      </svg>
    );
  }
  return (
    <svg width="80" height="72" viewBox="0 0 80 72" fill="none" className="text-neutral-300 dark:text-neutral-700">
      <circle cx="34" cy="32" r="18" stroke={stroke} strokeWidth={sw} />
      <line x1="48" y1="46" x2="62" y2="60" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="round" />
    </svg>
  );
}
