import React, { useState, useEffect, useRef } from 'react';

/* ── Reveal ─────────────────────────────────────────── */
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  once?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, style = {}, className, ...rest }) => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), Math.max(16, delay));
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      ...style,
      opacity: shown ? 1 : 0,
      transform: shown ? 'translate3d(0,0,0)' : 'translate3d(0,14px,0)',
      filter: shown ? 'blur(0)' : 'blur(2px)',
      transition: 'opacity 720ms cubic-bezier(.2,.7,.2,1), transform 720ms cubic-bezier(.2,.7,.2,1), filter 720ms cubic-bezier(.2,.7,.2,1)',
      willChange: 'opacity, transform, filter',
    }} className={className} {...rest}>
      {children}
    </div>
  );
};

/* ── CountUp ────────────────────────────────────────── */
interface CountUpProps {
  end: number;
  duration?: number;
  format?: (v: number) => string | number;
  suffix?: string;
  prefix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({ end = 0, duration = 1200, format = (v) => v, suffix = '', prefix = '' }) => {
  const [val, setVal] = useState(end);

  useEffect(() => {
    setVal(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const k = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setVal(end * eased);
      if (k >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [end, duration]);

  return <span>{prefix}{format(Math.round(val))}{suffix}</span>;
};

/* ── Skeleton ────────────────────────────────────────── */
interface SkeletonProps {
  width?: string | number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 14, radius = 8, style = {} }) => (
  <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
);

/* ── AmbientGlow ─────────────────────────────────────── */
interface AmbientGlowProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({ size = 480, color = 'rgba(164,74,58,0.30)', style = {} }) => (
  <div style={{
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    filter: 'blur(40px)',
    pointerEvents: 'none',
    animation: 'glow-breath 3.6s ease-in-out infinite',
    ...style,
  }} />
);

/* ── IntensityRing ──────────────────────────────────── */
interface IntensityRingProps {
  value?: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sublabel?: string;
}

export const IntensityRing: React.FC<IntensityRingProps> = ({
  value = 0, size = 120, stroke = 6,
  color = '#a44a3a', track = 'rgba(31,26,19,0.10)', label, sublabel,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [animVal, setAnimVal] = useState(0);

  useEffect(() => {
    const dur = 1400;
    const t0 = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - t0;
      const k = Math.min(1, elapsed / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setAnimVal(value * eased);
      if (k >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [value]);

  const offset = c * (1 - animVal / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {label && <div style={{ fontSize: size * 0.22, fontWeight: 700, color: '#1f1a13', letterSpacing: '-0.02em', lineHeight: 1 }}>{label}</div>}
        {sublabel && <div style={{ fontSize: 9, fontWeight: 700, color: '#8a7e6d', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>{sublabel}</div>}
      </div>
    </div>
  );
};

/* ── LiveDot ─────────────────────────────────────────── */
interface LiveDotProps {
  color?: string;
  size?: number;
}

export const LiveDot: React.FC<LiveDotProps> = ({ color = '#a44a3a', size = 8 }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
    <span style={{
      position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.5,
      animation: 'glow-breath 1.8s ease-in-out infinite',
    }} />
    <span style={{ position: 'absolute', inset: size * 0.2, borderRadius: '50%', background: color }} />
  </span>
);

/* ── Toaster ─────────────────────────────────────────── */
interface ToastItem {
  id: string;
  text: string;
  tone: string;
}

type ShowToastFn = (t: { text: string; tone?: string } | string) => void;

let _showToast: ShowToastFn | null = null;

export function showToast(t: { text: string; tone?: string } | string) {
  _showToast?.(t);
}

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    _showToast = (t) => {
      const id = 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      const item: ToastItem = {
        id,
        text: typeof t === 'string' ? t : (t.text || ''),
        tone: typeof t === 'string' ? 'ink' : (t.tone || 'ink'),
      };
      setItems(prev => [...prev, item]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 3200);
    };
    return () => { _showToast = null; };
  }, []);

  return (
    <div style={{
      position: 'fixed', right: 24, bottom: 24, zIndex: 9999, display: 'flex',
      flexDirection: 'column', gap: 10, pointerEvents: 'none', alignItems: 'flex-end',
    }}>
      {items.map(it => (
        <div key={it.id} className="reveal-up" style={{
          background: '#1f1a13', color: '#fbf7ec', padding: '12px 16px', borderRadius: 12,
          fontSize: 13, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: '0 18px 40px -12px rgba(31,26,19,0.45)',
          borderLeft: `3px solid ${it.tone === 'primary' ? '#c66856' : it.tone === 'success' ? '#7a8e5a' : '#c48a3e'}`,
          pointerEvents: 'auto', maxWidth: 340,
        }}>{it.text}</div>
      ))}
    </div>
  );
};

/* ── useNow ──────────────────────────────────────────── */
export function useNow(interval = 30000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

export function parseRelative(s: string): number {
  if (!s) return 0;
  if (/just now|now/i.test(s)) return 0;
  const m = String(s).match(/(\d+)\s*([smhd])/i);
  if (!m) return 0;
  const n = +m[1];
  const unit = m[2].toLowerCase();
  return n * (unit === 's' ? 1000 : unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000);
}

export function formatRelative(deltaMs: number): string {
  if (deltaMs < 5000) return 'Just now';
  if (deltaMs < 60000) return Math.floor(deltaMs / 1000) + 's ago';
  if (deltaMs < 3600000) return Math.floor(deltaMs / 60000) + 'm ago';
  if (deltaMs < 86400000) return Math.floor(deltaMs / 3600000) + 'h ago';
  return Math.floor(deltaMs / 86400000) + 'd ago';
}
