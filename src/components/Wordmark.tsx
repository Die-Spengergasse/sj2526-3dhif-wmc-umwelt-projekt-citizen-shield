import React from 'react';
import { S } from '../design-tokens';

interface WordmarkProps {
  size?: 'sm' | 'lg';
  onClick?: () => void;
}

export const Wordmark: React.FC<WordmarkProps> = ({ size = 'sm', onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer',
    padding: 0, fontFamily: 'inherit', color: S.ink, whiteSpace: 'nowrap',
  }}>
    <div style={{ position: 'relative', width: size === 'lg' ? 40 : 30, height: size === 'lg' ? 40 : 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 40 40" width={size === 'lg' ? 40 : 30} height={size === 'lg' ? 40 : 30}>
        <defs>
          <linearGradient id="wm-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a44a3a"/>
            <stop offset="100%" stopColor="#c66856"/>
          </linearGradient>
        </defs>
        <path d="M20 4 L34 8 L34 20 C34 28 27 34 20 36 C13 34 6 28 6 20 L6 8 Z" fill="url(#wm-grad)" />
        <path d="M14 19 L18 23 L26 15" fill="none" stroke="#fbf7ec" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <div style={{ textAlign: 'left' }}>
      <div style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: size === 'lg' ? 22 : 17,
        letterSpacing: '-0.01em', color: S.ink, lineHeight: 1, fontWeight: 400,
      }}>Citizen Shield</div>
      {size === 'lg' && (
        <div style={{ fontSize: 9, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 4 }}>
          Community signal network
        </div>
      )}
    </div>
  </button>
);
