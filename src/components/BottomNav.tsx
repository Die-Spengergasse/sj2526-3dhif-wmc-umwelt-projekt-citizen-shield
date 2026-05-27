import React from 'react';
import { useLocation } from 'wouter';
import { Globe, Map as MapIcon, Radio, ShieldCheck, ShieldAlert } from 'lucide-react';
import { S } from '../design-tokens';
import { AppUser } from '../types';

interface BottomNavProps {
  user?: AppUser | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ user }) => {
  const [location, setLocation] = useLocation();

  const items = [
    { path: '/',        label: 'Hub',     icon: <Globe size={20}/> },
    { path: '/regions', label: 'Regions', icon: <MapIcon size={20}/> },
    { path: '/feed',    label: 'Feed',    icon: <Radio size={20}/> },
    { path: '/safety',  label: 'Safety',  icon: <ShieldCheck size={20}/> },
    ...(user?.isAdmin ? [{ path: '/moderation', label: 'Review', icon: <ShieldAlert size={20}/> }] : []),
  ];

  return (
    <nav className="cs-mobile-only cs-nav-mobile" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      padding: '6px 8px env(safe-area-inset-bottom,8px)',
      background: 'rgba(240,233,218,0.92)', backdropFilter: 'blur(20px) saturate(150%)',
      borderTop: `1px solid ${S.rule}`,
    }}>
      {items.map(item => {
        const active = item.path === '/' ? location === '/' : location.startsWith(item.path);
        return (
          <button key={item.path} onClick={() => setLocation(item.path)}
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
