import React from 'react';
import { S } from '../design-tokens';

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, color, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', borderRadius: 10, border: `1px solid ${S.rule}`,
      background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', transition: 'all 200ms ease',
    }}
    onMouseEnter={e => {
      if (disabled) return;
      const b = e.currentTarget as HTMLButtonElement;
      b.style.background = S.paperHi;
      b.style.borderColor = S.ruleMd;
      b.style.transform = 'translateX(2px)';
    }}
    onMouseLeave={e => {
      const b = e.currentTarget as HTMLButtonElement;
      b.style.background = 'transparent';
      b.style.borderColor = S.rule;
      b.style.transform = 'translateX(0)';
    }}>
    <span style={{ fontSize: 13, fontWeight: 500, color: S.ink }}>{label}</span>
    <span style={{ color: color === 'text-primary' ? S.primary : color === 'text-secondary' ? S.secondary : S.tertiary }}>
      {icon}
    </span>
  </button>
);
