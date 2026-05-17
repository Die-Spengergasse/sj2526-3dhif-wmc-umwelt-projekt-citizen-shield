import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Map as MapIcon, Zap, Radio, ShieldCheck, Users,
  Bell, LogIn, LogOut, ChevronDown, CircleCheck,
} from 'lucide-react';
import { S } from '../design-tokens';
import { Wordmark } from './Wordmark';
import { Notification, AppUser } from '../types';

interface TopNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: AppUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView, onViewChange, user, onSignIn, onSignOut, notifications, onMarkRead, onMarkAllRead,
}) => {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread   = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const navItems = [
    { id: 'hub',       label: 'Hub',       icon: <Globe size={14}/> },
    { id: 'regions',   label: 'Regions',   icon: <MapIcon size={14}/> },
    { id: 'globe',     label: 'Globe',     icon: <Zap size={14}/> },
    { id: 'security',  label: 'Feed',      icon: <Radio size={14}/> },
    { id: 'safety',    label: 'Safety',    icon: <ShieldCheck size={14}/> },
    { id: 'community', label: 'Community', icon: <Users size={14}/> },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 18, paddingLeft: 24, paddingRight: 18,
      background: 'rgba(240,233,218,0.88)', backdropFilter: 'blur(18px) saturate(150%)',
      borderBottom: `1px solid ${S.ruleMd}`,
      boxShadow: '0 1px 0 rgba(251,247,236,0.7) inset, 0 12px 32px -24px rgba(89,46,28,0.18)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', flexShrink: 0,
        padding: '6px 14px 6px 8px', borderRadius: 14,
        background: 'rgba(251,247,236,0.55)', border: `1px solid ${S.ruleSoft}`,
      }}>
        <Wordmark size="lg" onClick={() => onViewChange('hub')} />
      </div>

      <div className="cs-desktop-only cs-topnav-items" style={{
        alignItems: 'center', gap: 2, minWidth: 0, flex: 1, justifyContent: 'center',
        padding: 4, borderRadius: 30, background: 'rgba(251,247,236,0.55)',
        border: `1px solid ${S.ruleSoft}`, maxWidth: 680,
      }}>
        {navItems.map(item => {
          const active = currentView === item.id;
          return (
            <button key={item.id} onClick={() => onViewChange(item.id)}
              style={{
                position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 24, border: 'none', cursor: 'pointer',
                background: active ? S.paper : 'transparent',
                color: active ? S.ink : S.muted,
                boxShadow: active ? '0 6px 18px -10px rgba(89,46,28,0.35), 0 0 0 1px rgba(31,26,19,0.06)' : 'none',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 700 : 500,
                letterSpacing: '-0.005em', whiteSpace: 'nowrap',
                transition: 'color 220ms ease, background 220ms ease, box-shadow 220ms ease',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = S.ink; e.currentTarget.style.background = 'rgba(31,26,19,0.04)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = S.muted; e.currentTarget.style.background = 'transparent'; } }}>
              <span style={{ display: 'inline-flex', color: active ? S.primary : 'inherit' }}>{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span style={{
                  position: 'absolute', left: '50%', bottom: -1, transform: 'translateX(-50%)',
                  width: 14, height: 2, background: S.primary, borderRadius: 2, opacity: 0.85,
                }}/>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {user ? (
          <>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(v => !v)} aria-label="Notifications"
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: notifOpen ? S.paperHi : 'transparent',
                  color: S.muted, transition: 'background 200ms ease, color 200ms ease', position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = S.paper; e.currentTarget.style.color = S.ink; }}
                onMouseLeave={e => { e.currentTarget.style.background = notifOpen ? S.paperHi : 'transparent'; e.currentTarget.style.color = S.muted; }}>
                <Bell size={17}/>
                {unread > 0 && (
                  <span className="warm-pulse" style={{
                    position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
                    background: S.primary, border: `2px solid ${S.bg}`,
                  }}/>
                )}
              </button>
              {notifOpen && (
                <div className="reveal-fade" style={{
                  position: 'absolute', right: 0, top: 46, width: 340, borderRadius: 14, overflow: 'hidden', zIndex: 999,
                  background: S.paper, border: `1px solid ${S.rule}`,
                  boxShadow: '0 32px 80px -16px rgba(89,46,28,0.35)',
                }}>
                  <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${S.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: S.ink }}>Notifications</span>
                    {unread > 0 && onMarkAllRead && (
                      <button onClick={onMarkAllRead} style={{
                        background: 'transparent', border: `1px solid ${S.rule}`, borderRadius: 20,
                        padding: '5px 11px', fontSize: 10, fontWeight: 700, color: S.muted,
                        textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'inherit',
                      }}>Mark all read</button>
                    )}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '40px 18px', textAlign: 'center', color: S.ash, fontSize: 13 }}>All caught up</div>
                    ) : notifications.map((n, i) => (
                      <div key={n.id}
                        onClick={() => !n.read && onMarkRead?.(n.id)}
                        style={{
                          display: 'flex', gap: 12, padding: '12px 18px',
                          borderBottom: i < notifications.length - 1 ? `1px solid ${S.ruleSoft}` : 'none',
                          background: !n.read ? 'rgba(164,74,58,0.04)' : 'transparent',
                          cursor: !n.read ? 'pointer' : 'default',
                        }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 7, flexShrink: 0, background: !n.read ? S.primary : S.paperSunk }} />
                        <div>
                          <p style={{ fontSize: 13, color: S.ink, lineHeight: 1.55, fontWeight: !n.read ? 500 : 400 }}>{n.text}</p>
                          <p style={{ fontSize: 10, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 30,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: menuOpen ? S.paperHi : 'transparent', transition: 'background 200ms ease',
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12,
                }}>{user.displayName?.[0]?.toUpperCase() || 'A'}</div>
                <span className="cs-desktop-only" style={{ fontSize: 12, fontWeight: 600, color: S.ink, maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName?.split(' ')[0]}
                </span>
                <ChevronDown size={12} className="cs-desktop-only" />
              </button>
              {menuOpen && (
                <div className="reveal-fade" style={{
                  position: 'absolute', right: 0, top: 46, width: 280, borderRadius: 14, overflow: 'hidden', zIndex: 999,
                  background: S.paper, border: `1px solid ${S.rule}`,
                  boxShadow: '0 32px 80px -16px rgba(89,46,28,0.35)',
                }}>
                  <div style={{ padding: 18, borderBottom: `1px solid ${S.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 17, flexShrink: 0,
                    }}>{user.displayName?.[0]?.toUpperCase() || 'A'}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: S.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</p>
                        {user.isVerified && <CircleCheck size={13} style={{ color: S.secondary, flexShrink: 0 }}/>}
                      </div>
                      <p style={{ fontSize: 11, color: S.ash }}>{user.email}</p>
                    </div>
                  </div>
                  <div style={{ padding: 14, borderBottom: `1px solid ${S.ruleSoft}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['totalPosts', 'Reports'], ['totalUpvotesReceived', 'Upvotes']] .map(([k, l]) => (
                      <div key={k}>
                        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, color: S.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
                          {user.stats[k as keyof typeof user.stats]}
                        </p>
                        <p style={{ fontSize: 9, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 8 }}>
                    <button onClick={() => { onSignOut(); setMenuOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        color: S.primary, background: 'transparent', fontFamily: 'inherit',
                      }}>
                      <LogOut size={15}/> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button onClick={onSignIn} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 30,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: 600, fontSize: 13, color: '#fff',
            background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
            boxShadow: '0 6px 18px -8px rgba(164,74,58,0.6)',
          }}>
            <LogIn size={15}/> Sign In
          </button>
        )}
      </div>
    </nav>
  );
};
