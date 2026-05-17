import React, { useState } from 'react';
import { Users, Activity, Globe, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { S, INTENSITY } from '../design-tokens';
import { Reveal, AmbientGlow, CountUp, IntensityRing } from '../motion';
import { Region } from '../types';

interface HubViewProps {
  regions: Region[];
  onViewChange?: (view: string) => void;
}

const resources = [
  { title: 'International Legal Rights', cat: 'Legal',    color: '#3d6b78' },
  { title: 'Digital Security Protocol',  cat: 'Security', color: '#a44a3a' },
  { title: 'Cross-Border Aid Logistics', cat: 'Aid',      color: '#7a8e5a' },
  { title: 'Crisis Communication Guide', cat: 'Comms',    color: '#3d6b78' },
  { title: 'Medical First Response',     cat: 'Medical',  color: '#7a8e5a' },
];

export const HubView: React.FC<HubViewProps> = ({ regions, onViewChange }) => {
  const [search, setSearch] = useState('');

  if (!regions.length) return null;

  const totalHubs = regions.reduce((a, r) => a + r.activeHubs, 0);
  const avgConn   = Math.round(regions.reduce((a, r) => a + r.connectivity, 0) / regions.length);
  const critical  = regions.filter(r => r.intensity === 'CRITICAL').length;

  const filtered = regions.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.intensity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* HERO */}
      <section style={{ position: 'relative', paddingTop: 8 }}>
        <AmbientGlow size={520} color="rgba(164,74,58,0.32)" style={{ top: -160, left: '40%', transform: 'translateX(-50%)', zIndex: -1 }} />
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase',
            letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'currentColor',
              verticalAlign: 'middle', opacity: 0.5 }} />
            Live · Global Coordination
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', fontWeight: 400, color: S.ink,
            letterSpacing: '-0.03em', lineHeight: 0.94, margin: 0 }}>
            Five regions.<br />
            <em style={{ fontStyle: 'italic', color: S.primary }}>One signal network.</em>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p style={{ fontSize: 16, color: S.muted, maxWidth: 560, lineHeight: 1.6, marginTop: 20 }}>
            Citizen Shield coordinates community-led mutual aid, verified safety reports, and encrypted
            communications across {regions.length} active crisis regions.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <button onClick={() => onViewChange?.('regions')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              fontFamily: 'inherit', color: '#fff',
              background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
              boxShadow: '0 8px 22px -10px rgba(164,74,58,0.55)',
            }}>
              Open Regions <ChevronRight size={14} />
            </button>
            <button onClick={() => onViewChange?.('safety')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              borderRadius: 30, border: `1px solid ${S.ruleMd}`, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: S.ink,
            }}>
              Safety Hub
            </button>
          </div>
        </Reveal>
      </section>

      {/* STATS */}
      <section>
        <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase',
          letterSpacing: '0.16em', marginBottom: 18 }}>Network status</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="cs-grid-md-4">
          {[
            { label: 'Active Hubs',      value: totalHubs,       accent: S.primary,    icon: <Users size={20} />,         delay: 0 },
            { label: 'Avg Connectivity', value: avgConn,         accent: S.secondary,  icon: <Activity size={20} />,      delay: 80, suffix: '%' },
            { label: 'Active Regions',   value: regions.length,  accent: S.tertiary,   icon: <Globe size={20} />,         delay: 160 },
            { label: 'Critical Zones',   value: critical,        accent: S.primary,    icon: <AlertTriangle size={20} />, delay: 240 },
          ].map(({ label, value, accent, icon, delay, suffix }) => (
            <Reveal key={label} delay={delay}>
              <div style={{ position: 'relative', padding: '22px 22px 20px', borderRadius: 18,
                background: S.paper, border: `1px solid ${S.rule}`, overflow: 'hidden' }} className="lift">
                <div style={{
                  position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%',
                  background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`, pointerEvents: 'none',
                }} />
                <div style={{ marginBottom: 14, display: 'inline-flex', color: accent }}>{icon}</div>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 'clamp(2.4rem, 5vw, 3.2rem)', color: S.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <CountUp end={value} />{suffix && <span style={{ fontSize: '0.6em', color: S.ash, marginLeft: 4 }}>{suffix}</span>}
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase',
                  letterSpacing: '0.16em', marginTop: 10 }}>{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* REGIONS + RESOURCES */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="cs-grid-lg-2a1">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              Regional Status
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                display: 'inline-flex', color: S.ash, pointerEvents: 'none' }}>
                <Search size={14} />
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search regions…"
                style={{ background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 30,
                  padding: '8px 14px 8px 36px', fontSize: 12, fontWeight: 500, color: S.ink,
                  outline: 'none', width: 200, fontFamily: 'inherit', transition: 'border-color 180ms ease' }}
                onFocus={e => (e.currentTarget.style.borderColor = S.ruleMd)}
                onBlur={e => (e.currentTarget.style.borderColor = S.rule)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {filtered.map((r, i) => {
              const intensity = INTENSITY[r.intensity] || INTENSITY.STABLE;
              return (
                <Reveal key={r.id} delay={i * 50}>
                  <button onClick={() => onViewChange?.('regions')} className="lift" style={{
                    width: '100%', textAlign: 'left', position: 'relative', padding: '18px 20px',
                    borderRadius: 14, background: S.paper, border: `1px solid ${S.rule}`,
                    cursor: 'pointer', fontFamily: 'inherit', overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24,
                          color: S.ink, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
                          {r.name.charAt(0) + r.name.slice(1).toLowerCase()}
                        </p>
                        <p style={{ fontSize: 11, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                          {r.activeHubs} hubs · {r.connectivity}% signal
                        </p>
                      </div>
                      <IntensityRing value={r.connectivity} size={56} stroke={4} color={intensity.color}
                        label={String(r.connectivity)} sublabel="" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                        padding: '3px 10px', borderRadius: 30, background: intensity.tone, color: intensity.color }}>
                        {r.intensity}
                      </span>
                      <span style={{ fontSize: 11, color: S.ash, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Open <ChevronRight size={11} />
                      </span>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase',
            letterSpacing: '0.16em', marginBottom: 18 }}>Global resources</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: S.paper,
            borderRadius: 16, border: `1px solid ${S.rule}`, overflow: 'hidden' }}>
            {resources.map((r, i) => (
              <Reveal key={r.title} delay={i * 50}>
                <button style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  borderBottom: i < resources.length - 1 ? `1px solid ${S.ruleSoft}` : 'none',
                  transition: 'background 200ms ease',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = S.paperHi)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: S.ink, fontWeight: 500 }}>{r.title}</span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                    {r.cat}
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
