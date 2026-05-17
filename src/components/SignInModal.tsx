import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { S } from '../design-tokens';
import { AmbientGlow } from '../motion';

interface SignInModalProps {
  onClose: () => void;
  onSignIn: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ onClose, onSignIn }) => (
  <div onClick={onClose} className="reveal-fade" style={{
    position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 16, background: 'rgba(31,26,19,0.55)', backdropFilter: 'blur(8px)',
  }}>
    <div onClick={e => e.stopPropagation()} className="reveal-up" style={{
      position: 'relative', width: '100%', maxWidth: 400, borderRadius: 20, padding: 36,
      textAlign: 'center', background: S.paper, border: `1px solid ${S.rule}`,
      boxShadow: '0 40px 80px -20px rgba(31,26,19,0.45)', overflow: 'hidden',
    }}>
      <AmbientGlow size={300} color="rgba(164,74,58,0.32)"
        style={{ top: -100, left: '50%', transform: 'translateX(-50%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px',
          boxShadow: '0 12px 32px -8px rgba(164,74,58,0.6)',
        }}>
          <ShieldCheck size={28} color="#fff" />
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, color: S.ink,
          letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1, fontStyle: 'italic' }}>
          Join the network
        </h2>
        <p style={{ fontSize: 14, color: S.muted, marginBottom: 24, lineHeight: 1.6 }}>
          Sign in to submit reports, vote on updates, and join regional coordination chats.
        </p>
        <button onClick={() => { onSignIn(); onClose(); }} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '13px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontWeight: 700, fontSize: 14, color: '#fff',
          background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
          boxShadow: '0 10px 28px -10px rgba(164,74,58,0.6)',
          transition: 'transform 220ms ease, box-shadow 220ms ease',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.transform = 'translateY(-1px)';
          b.style.boxShadow = '0 16px 36px -10px rgba(164,74,58,0.7)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.transform = 'translateY(0)';
          b.style.boxShadow = '0 10px 28px -10px rgba(164,74,58,0.6)';
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <p style={{ fontSize: 10, color: S.ash, marginTop: 18, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          Sign in with your Google account
        </p>
      </div>
    </div>
  </div>
);
