import React from 'react';
import { X } from 'lucide-react';
import { Region } from '../types';
import { S } from '../design-tokens';

interface RegionSelectorProps {
  regions: Region[];
  activeRegionId: string;
  onSelect: (index: number) => void;
  onClose: () => void;
}

const intensityColor: Record<string, string> = {
  CRITICAL: '#a44a3a',
  HIGH: '#fb923c',
  ALERT: '#7a8e5a',
  STABLE: '#3d6b78',
};

export const RegionSelector: React.FC<RegionSelectorProps> = ({ regions, activeRegionId, onSelect, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
    onClick={onClose}>
    <div style={{ width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden',
      background: S.surf1, border: `1px solid ${S.borderMd}`, boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}
      onClick={e => e.stopPropagation()}>
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: S.text }}>Select Region</h3>
          <p style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{regions.length} active crisis zones</p>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${S.border}`,
          background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: S.muted }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {regions.map((r, i) => {
          const active = r.id === activeRegionId;
          const iColor = intensityColor[r.intensity] || S.primary;
          return (
            <button key={r.id} onClick={() => { onSelect(i); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 14,
                border: `1px solid ${active ? S.primary : S.border}`,
                background: active ? `${S.primary}12` : S.surf2,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: iColor, flexShrink: 0,
                  boxShadow: r.intensity === 'CRITICAL' ? `0 0 8px ${iColor}` : 'none' }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: active ? S.primary : S.text,
                    letterSpacing: '-0.01em' }}>{r.name}</p>
                  <p style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>
                    {r.activeHubs} hubs · {r.connectivity}% signal
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: iColor, background: `${iColor}18`, padding: '3px 8px', borderRadius: 6 }}>
                {r.intensity}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
