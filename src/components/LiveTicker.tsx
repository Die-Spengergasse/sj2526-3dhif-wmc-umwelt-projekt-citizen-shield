import React, { useMemo } from 'react';
import { S, INTENSITY } from '../design-tokens';
import { LiveDot } from '../motion';
import { Region, Post } from '../types';

interface LiveTickerProps {
  regions?: Region[];
  posts?: Post[];
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ regions = [], posts = [] }) => {
  const items = useMemo(() => {
    const out: Array<{ slug: string; name: string; intensity: string; title: string }> = [];
    regions.forEach(r => {
      const recent = posts.find(p => p.regionId === r.slug);
      out.push({
        slug: r.slug,
        name: r.name,
        intensity: r.intensity,
        title: recent?.title || r.description?.split('.')[0] || 'Network stable',
      });
    });
    return out.length
      ? out
      : [{ slug: '-', name: 'CITIZEN SHIELD', intensity: 'STABLE', title: 'Network online' }];
  }, [regions, posts]);

  const loop = [...items, ...items];

  return (
    <div role="region" aria-label="Live network ticker" style={{
      position: 'fixed', top: 72, left: 0, right: 0, zIndex: 40,
      background: `linear-gradient(180deg, ${S.paperHi} 0%, ${S.paper} 100%)`,
      borderBottom: `1px solid ${S.rule}`, height: 34, overflow: 'hidden',
      display: 'flex', alignItems: 'stretch',
    }}>
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
        padding: '0 24px 0 18px', background: S.ink, color: S.paper,
        clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        <LiveDot color="#e87760" size={7} />
        <span>LIVE · {new Date().toUTCString().slice(17, 25)} UTC</span>
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', minWidth: 0,
        animation: 'cs-ticker-scroll 60s linear infinite', whiteSpace: 'nowrap',
        willChange: 'transform', paddingLeft: 14,
      }}>
        {loop.map((it, i) => {
          const conf = INTENSITY[it.intensity as keyof typeof INTENSITY] || INTENSITY.STABLE;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0 18px', flexShrink: 0 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: conf.color,
                animation: it.intensity === 'CRITICAL' ? 'warm-pulse 1.5s ease-out infinite' : 'none',
                display: 'inline-block',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 800, color: S.ink,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.18em',
              }}>{it.name}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: conf.color,
                textTransform: 'uppercase', letterSpacing: '0.16em' }}>{conf.label}</span>
              <span style={{ fontSize: 11, color: S.muted, fontWeight: 500,
                maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</span>
              <span aria-hidden style={{ color: S.ash, fontSize: 11, fontWeight: 600 }}>·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
