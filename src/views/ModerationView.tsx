import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Check, X, MapPin, Clock, User, Loader2 } from 'lucide-react';
import { S } from '../design-tokens';
import { Reveal, AmbientGlow } from '../motion';
import { AppUser } from '../types';
import { fetchModerationQueue, reviewPost, ApiModerationItem } from '../api';

interface ModerationViewProps {
  user: AppUser | null;
  onSignIn: () => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_COLOR: Record<string, string> = {
  critical:  S.primary,
  info:      S.secondary,
  broadcast: S.tertiary,
};

export const ModerationView: React.FC<ModerationViewProps> = ({ user, onSignIn }) => {
  const [queue,          setQueue]          = useState<ApiModerationItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [reviewing,      setReviewing]      = useState<Record<string, boolean>>({});
  const [reviewed,       setReviewed]       = useState<Record<string, 'approved' | 'rejected'>>({});
  const [expandedAction, setExpandedAction] = useState<Record<string, 'approve' | 'reject' | null>>({});
  const [reasons,        setReasons]        = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchModerationQueue()
      .then(data => { setQueue(data); setLoading(false); })
      .catch(err => { setError(err instanceof Error ? err.message : 'Failed to load queue'); setLoading(false); });
  }, []);

  useEffect(() => { if (user) load(); else setLoading(false); }, [user, load]);

  const openAction = (id: string, action: 'approve' | 'reject') => {
    setExpandedAction(prev => ({ ...prev, [id]: prev[id] === action ? null : action }));
  };

  const handleReview = async (item: ApiModerationItem, decision: 'approved' | 'rejected') => {
    const reason = reasons[item.id]?.trim();
    if (decision === 'rejected' && !reason) return;

    setReviewing(prev => ({ ...prev, [item.id]: true }));
    try {
      await reviewPost(item.id, decision, reason || undefined);
      setReviewed(prev => ({ ...prev, [item.id]: decision }));
      setExpandedAction(prev => ({ ...prev, [item.id]: null }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setReviewing(prev => ({ ...prev, [item.id]: false }));
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 24px', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: S.ash, opacity: 0.3 }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: S.ink }}>Sign in to access moderation</p>
        <button onClick={onSignIn} style={{
          padding: '10px 24px', borderRadius: 30, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 700, fontSize: 13, color: '#fff',
          background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
          boxShadow: '0 6px 18px -8px rgba(164,74,58,0.6)',
        }}>Sign In</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* HERO */}
      <section style={{ position: 'relative' }}>
        <AmbientGlow size={380} color="rgba(164,74,58,0.15)" style={{ top: -120, left: '20%', zIndex: -1 }} />
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase',
            letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'currentColor', verticalAlign: 'middle', opacity: 0.5 }} />
            Moderation Queue
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.4rem, 6vw, 4.8rem)', fontWeight: 400, color: S.ink,
            letterSpacing: '-0.03em', lineHeight: 0.94, margin: 0 }}>
            Review<br />
            <em style={{ fontStyle: 'italic', color: S.primary }}>pending reports.</em>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p style={{ fontSize: 15, color: S.muted, maxWidth: 520, lineHeight: 1.6, marginTop: 20 }}>
            Approve or reject submissions before they go live in the feed.
          </p>
        </Reveal>
      </section>

      {/* Queue header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          {loading ? 'Loading…' : `${queue.length - Object.keys(reviewed).length} pending`}
        </span>
        <button onClick={load} disabled={loading} style={{
          padding: '6px 14px', borderRadius: 20, border: `1px solid ${S.rule}`,
          background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: S.muted,
          textTransform: 'uppercase', letterSpacing: '0.12em', opacity: loading ? 0.5 : 1,
          transition: 'all 180ms ease',
        }}>Refresh</button>
      </div>

      {/* States */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '60px 24px', color: S.muted }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Loading queue…</span>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '32px 24px', textAlign: 'center', background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 14 }}>
          <p style={{ fontSize: 14, color: S.primary, fontWeight: 600 }}>{error}</p>
          <button onClick={load} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 20, border: `1px solid ${S.rule}`, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: S.ink }}>Try again</button>
        </div>
      )}

      {!loading && !error && queue.length === 0 && (
        <div style={{ padding: 64, textAlign: 'center', background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
          <ShieldAlert size={44} style={{ color: S.ash, opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: S.ink }}>Queue is empty</p>
          <p style={{ fontSize: 11, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 6 }}>
            All submissions have been reviewed
          </p>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && queue.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {queue.map((item, i) => {
            const done = reviewed[item.id];
            const busy = reviewing[item.id];
            const action = expandedAction[item.id];
            const typeColor = TYPE_COLOR[item.post.type] || S.secondary;
            const reason = reasons[item.id] || '';

            return (
              <Reveal key={item.id} delay={i * 50}>
                <div style={{
                  background: S.paper, border: `1px solid ${done ? S.ruleSoft : S.rule}`,
                  borderRadius: 14, padding: '20px 22px',
                  opacity: done ? 0.55 : 1, transition: 'opacity 300ms ease',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Left accent */}
                  <span style={{
                    position: 'absolute', left: 0, top: 14, bottom: 14, width: 3,
                    borderRadius: '0 3px 3px 0',
                    background: done === 'approved' ? '#22c55e' : done === 'rejected' ? S.primary : typeColor,
                    opacity: 0.75,
                  }} />

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Content */}
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      {/* Meta row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', marginBottom: 8 }}>
                        <span style={{
                          fontSize: 9.5, fontWeight: 700, color: typeColor,
                          textTransform: 'uppercase', letterSpacing: '0.16em',
                          padding: '2px 8px', borderRadius: 20,
                          background: typeColor + '18',
                        }}>{item.post.type}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                          {item.post.region.name}
                        </span>
                        {item.distanceM !== null && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: S.muted }}>
                            <MapPin size={10} />
                            {item.distanceM < 1000
                              ? `${Math.round(item.distanceM)}m from region`
                              : `${(item.distanceM / 1000).toFixed(1)}km from region`}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: S.ash }}>
                          <Clock size={10} />
                          {formatTime(item.createdAt)}
                        </span>
                      </div>

                      <h3 style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 16, fontWeight: 700, color: S.ink,
                        letterSpacing: '-0.01em', lineHeight: 1.3, margin: '0 0 6px',
                      }}>{item.post.title}</h3>

                      <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.6, margin: '0 0 10px' }}>
                        {item.post.description}
                      </p>

                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: S.ash }}>
                        <User size={11} />
                        {item.post.author.displayName}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 120 }}>
                      {done ? (
                        <span style={{
                          padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center',
                          background: done === 'approved' ? '#22c55e20' : S.primary + '18',
                          color: done === 'approved' ? '#16a34a' : S.primary,
                          border: `1px solid ${done === 'approved' ? '#22c55e40' : S.primary + '40'}`,
                        }}>
                          {done === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => openAction(item.id, 'approve')}
                            disabled={busy}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '9px 18px', borderRadius: 20, border: `1px solid ${action === 'approve' ? '#22c55e' : '#22c55e60'}`,
                              background: action === 'approve' ? '#22c55e18' : '#22c55e12',
                              cursor: busy ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                              color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase',
                              opacity: busy ? 0.6 : 1, transition: 'all 160ms ease',
                            }}>
                            <Check size={13} />
                            Approve
                          </button>
                          <button
                            onClick={() => openAction(item.id, 'reject')}
                            disabled={busy}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '9px 18px', borderRadius: 20, border: `1px solid ${action === 'reject' ? S.primary : S.primary + '50'}`,
                              background: action === 'reject' ? S.primary + '18' : S.primary + '10',
                              cursor: busy ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                              color: S.primary, letterSpacing: '0.1em', textTransform: 'uppercase',
                              opacity: busy ? 0.6 : 1, transition: 'all 160ms ease',
                            }}>
                            <X size={13} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline reason / note form */}
                  {!done && action && (
                    <div style={{
                      marginTop: 14, padding: '14px 16px', borderRadius: 10,
                      background: action === 'reject' ? S.primary + '08' : '#22c55e0a',
                      border: `1px solid ${action === 'reject' ? S.primary + '30' : '#22c55e30'}`,
                    }}>
                      <label style={{
                        fontSize: 10, fontWeight: 700, color: action === 'reject' ? S.primary : '#16a34a',
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        display: 'block', marginBottom: 8,
                      }}>
                        {action === 'reject' ? 'Reason (required)' : 'Note (optional)'}
                      </label>
                      <textarea
                        value={reason}
                        onChange={e => setReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder={action === 'reject'
                          ? 'Explain why this report is being rejected…'
                          : 'Add an optional note for the author…'}
                        rows={3}
                        style={{
                          width: '100%', background: S.paperHi, border: `1px solid ${S.rule}`,
                          borderRadius: 8, padding: '8px 11px', fontSize: 12.5, color: S.ink,
                          outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                          transition: 'border-color 160ms ease',
                        }}
                        onFocus={e => (e.target.style.borderColor = action === 'reject' ? S.primary : '#22c55e')}
                        onBlur={e => (e.target.style.borderColor = S.rule)}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setExpandedAction(prev => ({ ...prev, [item.id]: null }))}
                          style={{
                            padding: '7px 14px', borderRadius: 20, border: `1px solid ${S.rule}`,
                            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: 11, fontWeight: 700, color: S.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReview(item, action === 'reject' ? 'rejected' : 'approved')}
                          disabled={busy || (action === 'reject' && !reason.trim())}
                          style={{
                            padding: '7px 18px', borderRadius: 20, border: 'none',
                            cursor: busy || (action === 'reject' && !reason.trim()) ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: '#fff',
                            background: action === 'reject' ? S.primary : '#22c55e',
                            opacity: busy || (action === 'reject' && !reason.trim()) ? 0.6 : 1,
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          {busy
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : action === 'reject' ? <X size={12} /> : <Check size={12} />
                          }
                          {action === 'reject' ? 'Confirm Reject' : 'Confirm Approve'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
};
