import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, MapPin, PhoneCall, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { S } from '../design-tokens';
import { Reveal, AmbientGlow } from '../motion';
import { Region } from '../types';

interface SafetyViewProps {
  regions: Region[];
  activeRegionIdx: number;
  onRegionChange: (idx: number) => void;
}

const protocols = [
  { t: 'Check-in with Local Hub',  d: 'Notify your community hub of your status and location at least daily.' },
  { t: 'Verified Information Only', d: 'Only share information cross-verified by two community nodes.' },
  { t: 'Emergency Supplies',        d: 'Keep first aid, water, and non-perishable food accessible.' },
  { t: 'Cluster Movement',          d: 'Stay within community clusters — avoid moving alone after dark.' },
];
const digital = [
  { t: 'Secure Communication', d: 'Use encrypted messaging for all community coordination.' },
  { t: 'Metadata Protection',  d: 'Remove EXIF data from photos before sharing on the feed.' },
  { t: 'VPN Usage',            d: 'Always use a verified VPN when accessing community resources.' },
  { t: 'Device Security',      d: 'Enable full-disk encryption and strong passcodes on all devices.' },
];

export const SafetyView: React.FC<SafetyViewProps> = ({ regions, activeRegionIdx, onRegionChange }) => {
  const activeRegion = regions[activeRegionIdx] || regions[0];
  if (!activeRegion) return null;

  const go = (delta: number) =>
    onRegionChange((activeRegionIdx + delta + regions.length) % regions.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* HERO */}
      <section style={{ position: 'relative' }}>
        <AmbientGlow size={460} color="rgba(122,142,90,0.30)" style={{ top: -140, left: '30%', zIndex: -1 }} />
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#7a8e5a', textTransform: 'uppercase',
            letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'currentColor',
              verticalAlign: 'middle', opacity: 0.5 }} />
            Safety Protocol
          </p>
        </Reveal>

        {/* Region navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
          <button onClick={() => go(-1)} aria-label="Previous region" style={{
            width: 42, height: 42, borderRadius: '50%', border: `1px solid ${S.ruleMd}`,
            background: S.paper, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: S.ink, transition: 'all 200ms ease', flexShrink: 0,
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.ink; b.style.color = S.paper; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.paper; b.style.color = S.ink; }}>
            <ChevronLeft size={18} />
          </button>

          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', fontWeight: 400, color: S.ink,
            letterSpacing: '-0.03em', lineHeight: 0.94, margin: 0, fontStyle: 'italic', flex: 1, minWidth: 0 }}>
            {activeRegion.name.charAt(0) + activeRegion.name.slice(1).toLowerCase()}
          </h1>

          <button onClick={() => go(1)} aria-label="Next region" style={{
            width: 42, height: 42, borderRadius: '50%', border: `1px solid ${S.ruleMd}`,
            background: S.paper, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: S.ink, transition: 'all 200ms ease', flexShrink: 0,
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.ink; b.style.color = S.paper; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.paper; b.style.color = S.ink; }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dot nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          {regions.map((r, i) => (
            <button key={r.id} onClick={() => onRegionChange(i)} style={{
              border: 'none', cursor: 'pointer', padding: 0, borderRadius: 4,
              width: i === activeRegionIdx ? 30 : 8, height: 6,
              background: i === activeRegionIdx ? '#7a8e5a' : 'rgba(31,26,19,0.20)',
              transition: 'width 320ms cubic-bezier(.2,.7,.2,1), background 320ms ease',
            }} />
          ))}
        </div>

        <Reveal delay={80}>
          <em style={{ display: 'block', fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontStyle: 'italic', color: '#7a8e5a',
            letterSpacing: '-0.02em', lineHeight: 1 }}>
            Stay informed. Stay safe.
          </em>
        </Reveal>
        <Reveal delay={180}>
          <p style={{ fontSize: 16, color: S.muted, maxWidth: 560, lineHeight: 1.6, marginTop: 20 }}>
            Essential protocols, emergency guides, and mutual aid resources. Refresh your knowledge
            here before stepping outside or going dark.
          </p>
        </Reveal>
      </section>

      {/* EMERGENCY + SAFE ZONES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="cs-grid-md-3">
        <Reveal>
          <div style={{ padding: 24, position: 'relative', overflow: 'hidden', height: '100%',
            background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
            <AmbientGlow size={220} color="rgba(164,74,58,0.22)" style={{ top: -80, right: -80 }} />
            <div style={{ position: 'relative' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase',
                letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <PhoneCall size={11} /> Emergency hotline
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500,
                color: S.ink, letterSpacing: '-0.01em', marginBottom: 10, wordBreak: 'break-all' }}>
                {activeRegion.localInfo.emergencyContact || 'Contact local hub'}
              </p>
              <p style={{ fontSize: 11, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                Verified regional node · 24/7
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100} style={{ gridColumn: 'span 2' }}>
          <div style={{ padding: 24, height: '100%', background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.secondary, textTransform: 'uppercase',
              letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={11} /> Verified safe zones
            </p>
            {activeRegion.localInfo.safeZones.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {activeRegion.localInfo.safeZones.map((zone, i) => (
                  <Reveal key={i} delay={i * 60}>
                    <div className="lift" style={{ display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderRadius: 12, background: S.paperHi, border: `1px solid ${S.ruleSoft}` }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.secondary,
                        flexShrink: 0, display: 'inline-block' }} className="warm-pulse" />
                      <span style={{ fontWeight: 500, fontSize: 13, color: S.ink }}>{zone}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: S.ash }}>No safe zones listed yet for this region.</p>
            )}
          </div>
        </Reveal>
      </div>

      {/* PROTOCOL CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="cs-grid-md-2">
        {[
          { title: 'Core safety protocol', eyebrow: 'Field guide · level 1', icon: <ShieldCheck size={20} />, color: S.primary,   items: protocols },
          { title: 'Digital security',     eyebrow: 'Comms guide · level 1', icon: <Lock size={20} />,        color: S.secondary, items: digital   },
        ].map((sec, j) => (
          <Reveal key={sec.title} delay={j * 100}>
            <div style={{ padding: 28, height: '100%', position: 'relative', overflow: 'hidden',
              background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: sec.color, textTransform: 'uppercase',
                letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                {sec.eyebrow}
              </p>
              <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, color: S.ink,
                letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 20, fontStyle: 'italic' }}>
                {sec.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sec.items.map((p, i) => (
                  <Reveal key={p.t} delay={j * 100 + i * 60 + 200}>
                    <div style={{ display: 'flex', gap: 14, padding: '14px 0',
                      borderTop: i === 0 ? 'none' : `1px solid ${S.ruleSoft}` }}>
                      <div style={{ width: 24, height: 24, borderRadius: 8,
                        background: `${sec.color}18`, color: sec.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: 13.5, color: S.ink, marginBottom: 4, letterSpacing: '-0.005em' }}>
                          {p.t}
                        </h4>
                        <p style={{ fontSize: 12.5, color: S.muted, lineHeight: 1.55 }}>{p.d}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* RESOURCES */}
      <Reveal>
        <div style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden',
          background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.tertiary, textTransform: 'uppercase',
            letterSpacing: '0.18em', marginBottom: 14 }}>Locally available · {activeRegion.name}</p>
          <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, color: S.ink,
            letterSpacing: '-0.02em', marginBottom: 24, lineHeight: 1, fontStyle: 'italic' }}>
            Resources nearby
          </h3>
          {activeRegion.localInfo.resources.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {activeRegion.localInfo.resources.map((resource, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="lift" style={{ display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 18px', borderRadius: 12, background: S.paperHi,
                    border: `1px solid ${S.ruleSoft}`, cursor: 'pointer' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10,
                      background: `${S.tertiary}18`, color: S.tertiary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Heart size={16} />
                    </div>
                    <span style={{ fontWeight: 500, fontSize: 13, color: S.ink }}>{resource}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: S.ash }}>No resources listed yet for this region.</p>
          )}
        </div>
      </Reveal>
    </div>
  );
};
