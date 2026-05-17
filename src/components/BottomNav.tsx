import React from 'react';
import { Globe, Map as MapIcon, Radio, ShieldCheck, Users } from 'lucide-react';
import { S } from '../design-tokens';

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  const items = [
    { id: 'hub',       label: 'Hub',     icon: <Globe size={20}/> },
    { id: 'regions',   label: 'Regions', icon: <MapIcon size={20}/> },
    { id: 'security',  label: 'Feed',    icon: <Radio size={20}/> },
    { id: 'safety',    label: 'Safety',  icon: <ShieldCheck size={20}/> },
    { id: 'community', label: 'Comm.',   icon: <Users size={20}/> },
  ];

  return (
    <nav className="cs-mobile-only cs-nav-mobile" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      padding: '6px 8px env(safe-area-inset-bottom,8px)',
      background: 'rgba(240,233,218,0.92)', backdropFilter: 'blur(20px) saturate(150%)',
      borderTop: `1px solid ${S.rule}`,
    }}>
      {items.map(item => {
        const active = currentView === item.id;
        return (
          <button key={item.id} onClick={() => onViewChange(item.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '8px 4px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: active ? S.primary : S.muted, fontFamily: 'inherit', position: 'relative',
              transition: 'color 200ms ease',
            }}>
            {active && (
              <span style={{
                position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 3, borderRadius: '0 0 2px 2px', background: S.primary,
              }}/>
            )}
            <span style={{ display: 'inline-flex' }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
