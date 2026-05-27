import React, { useState, useEffect, useCallback, Fragment } from 'react';
import ReactDOM from 'react-dom';
import {
  ShieldAlert, Check, X, MapPin, Clock, User, Loader2,
  ChevronLeft, ChevronRight, ImageIcon, Maximize2,
} from 'lucide-react';
import { S } from '../design-tokens';
import { Reveal, AmbientGlow } from '../motion';
import { AppUser } from '../types';
import { fetchModerationQueue, reviewPost, ApiModerationItem } from '../api';
import { useRealtimeTopic } from '../context/RealtimeContext';

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

function formatDescription(text: string) {
  return text.split('\n\n').map((paragraph, i) => (
    <p key={i} style={{ margin: '0 0 14px', lineHeight: 1.7 }}>
      {paragraph.split('\n').map((line, j, arr) => (
        <Fragment key={j}>
          {line}
          {j < arr.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  ));
}

const TYPE_COLOR: Record<string, string> = {
  critical:  S.primary,
  info:      S.secondary,
  broadcast: S.tertiary,
};

const TYPE_LABEL: Record<string, string> = {
  critical:  'Critical',
  info:      'Info',
  broadcast: 'Broadcast',
};

// ── Lightbox ─────────────────────────────────────────────────

interface LightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [images.length, onClose]);

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.92)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <button onClick={e => { e.stopPropagation(); onClose(); }} style={{
        position: 'absolute', top: 16, right: 16, width: 40, height: 40,
        borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>
        <X size={18} />
      </button>

      {images.length > 1 && (
        <span style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {idx + 1} / {images.length}
        </span>
      )}

      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }} style={{
          position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <ChevronLeft size={22} />
        </button>
      )}

      <img
        src={images[idx]}
        alt={`Image ${idx + 1}`}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain', borderRadius: 12,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
          userSelect: 'none',
        }}
        referrerPolicy="no-referrer"
      />

      {idx < images.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }} style={{
          position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <ChevronRight size={22} />
        </button>
      )}
    </div>,
    document.body
  );
};

// ── ImageGrid ────────────────────────────────────────────────

interface ImageGridProps {
  images: string[];
  title: string;
  onImageClick: (idx: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, title, onImageClick }) => {
  if (images.length === 1) {
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 18, cursor: 'zoom-in' }}
        onClick={() => onImageClick(0)}>
        <div style={{ aspectRatio: '16/10', background: S.paperHi }}>
          <img src={images[0]} alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            referrerPolicy="no-referrer" />
        </div>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
        {images.map((src, i) => (
          <div key={i} style={{ aspectRatio: '4/3', cursor: 'zoom-in', background: S.paperHi }} onClick={() => onImageClick(i)}>
            <img src={src} alt={`${title} ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden', cursor: 'zoom-in' }}
        onClick={() => onImageClick(0)}>
        <div style={{ aspectRatio: '16/9', background: S.paperHi }}>
          <img src={images[0]} alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            referrerPolicy="no-referrer" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {images.slice(1).map((src, i) => {
          const last = i === images.slice(1).length - 1;
          return (
            <div key={i} style={{
              flex: 1, aspectRatio: '1/1',
              borderRadius: i === 0 ? '0 0 0 12px' : last ? '0 0 12px 0' : 0,
              overflow: 'hidden', cursor: 'zoom-in', background: S.paperHi,
            }}
              onClick={() => onImageClick(i + 1)}>
              <img src={src} alt={`${title} ${i + 2}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                referrerPolicy="no-referrer" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Preview Modal ────────────────────────────────────────────

interface PreviewModalProps {
  item: ApiModerationItem;
  busy: boolean;
  action: 'approve' | 'reject' | null;
  reason: string;
  onClose: () => void;
  onAction: (action: 'approve' | 'reject') => void;
  onReasonChange: (v: string) => void;
  onCancelAction: () => void;
  onConfirm: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  item, busy, action, reason,
  onClose, onAction, onReasonChange, onCancelAction, onConfirm,
}) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const typeColor = TYPE_COLOR[item.post.type] || S.secondary;
  const images = item.post.images?.length ? item.post.images : (item.post.imageUrl ? [item.post.imageUrl] : []);
  const locationLabel = item.post.locationText
    || item.post.locationLabel
    || (item.post.locationLat != null && item.post.locationLng != null
        ? `~${item.post.locationLat.toFixed(3)}, ${item.post.locationLng.toFixed(3)}`
        : null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && lightboxIdx === null) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, lightboxIdx]);

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  return ReactDOM.createPortal(
    <>
      {lightboxIdx !== null && (
        <Lightbox images={images} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(31,26,19,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(8px, 2vw, 24px)', overflow: 'hidden',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: '100%', maxWidth: 760, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          background: S.paper, borderRadius: 20,
          border: `1px solid ${S.rule}`,
          boxShadow: '0 40px 100px -16px rgba(89,46,28,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            flexShrink: 0, padding: '14px 18px', borderBottom: `1px solid ${S.rule}`,
            background: 'rgba(251,247,236,0.96)', backdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{
              fontSize: 9.5, fontWeight: 700, color: typeColor,
              textTransform: 'uppercase', letterSpacing: '0.16em',
              padding: '4px 10px', borderRadius: 20,
              background: typeColor + '18', border: `1px solid ${typeColor}30`,
            }}>{TYPE_LABEL[item.post.type] || item.post.type}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {item.post.region.name}
            </span>
            <span style={{ flex: 1 }} />
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${S.rule}`,
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: S.muted, transition: 'all 160ms ease', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = S.paperHi; e.currentTarget.style.color = S.ink; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.muted; }}>
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '24px 28px 8px' }}>
            {/* Title */}
            <h2 style={{
              fontFamily: item.post.type === 'broadcast' ? "'Instrument Serif', Georgia, serif" : "'Plus Jakarta Sans', sans-serif",
              fontSize: item.post.type === 'broadcast' ? 30 : 26,
              fontWeight: item.post.type === 'broadcast' ? 400 : 700,
              fontStyle: item.post.type === 'broadcast' ? 'italic' : 'normal',
              color: S.ink, letterSpacing: '-0.02em', lineHeight: 1.2,
              margin: '0 0 14px',
            }}>
              {item.post.type === 'broadcast' ? `"${item.post.title}"` : item.post.title}
            </h2>

            {/* Meta row */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px',
              marginBottom: 22, paddingBottom: 16, borderBottom: `1px solid ${S.ruleSoft}`,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.muted }}>
                <User size={12} />
                <span style={{ fontWeight: 600, color: S.ink }}>{item.post.author.displayName}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.muted }}>
                <Clock size={12} />
                {formatTime(item.createdAt)}
              </span>
              {locationLabel && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.muted, fontStyle: 'italic' }}>
                  <MapPin size={12} />
                  {locationLabel}
                </span>
              )}
              {item.distanceM !== null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.ash }}>
                  {item.distanceM < 1000
                    ? `${Math.round(item.distanceM)}m from region`
                    : `${(item.distanceM / 1000).toFixed(1)}km from region`}
                </span>
              )}
            </div>

            {/* Images */}
            {images.length > 0 && (
              <ImageGrid images={images} title={item.post.title} onImageClick={setLightboxIdx} />
            )}

            {/* Description */}
            <div style={{
              fontSize: 15, color: S.inkSoft, lineHeight: 1.7,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: 'normal',
            }}>
              {formatDescription(item.post.description)}
            </div>

            {/* Reason from reporter (if any) */}
            {item.reason && (
              <div style={{
                marginTop: 18, padding: '12px 14px', borderRadius: 10,
                background: S.paperHi, border: `1px solid ${S.ruleSoft}`,
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, color: S.ash,
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                  margin: '0 0 6px',
                }}>Submission reason</p>
                <p style={{ fontSize: 13, color: S.inkSoft, lineHeight: 1.55, margin: 0 }}>
                  {item.reason}
                </p>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div style={{
            flexShrink: 0, padding: '14px 18px', borderTop: `1px solid ${S.rule}`,
            background: 'rgba(251,247,236,0.96)', backdropFilter: 'blur(14px)',
          }}>
            {action ? (
              <div>
                <label style={{
                  fontSize: 10, fontWeight: 700, color: action === 'reject' ? S.primary : '#16a34a',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  display: 'block', marginBottom: 8,
                }}>
                  {action === 'reject' ? 'Reason (required)' : 'Note (optional)'}
                </label>
                <textarea
                  value={reason}
                  onChange={e => onReasonChange(e.target.value)}
                  placeholder={action === 'reject'
                    ? 'Explain why this report is being rejected…'
                    : 'Add an optional note for the author…'}
                  rows={2}
                  autoFocus
                  style={{
                    width: '100%', background: S.paperHi, border: `1px solid ${S.rule}`,
                    borderRadius: 8, padding: '8px 11px', fontSize: 13, color: S.ink,
                    outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 160ms ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = action === 'reject' ? S.primary : '#22c55e')}
                  onBlur={e => (e.target.style.borderColor = S.rule)}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                  <button onClick={onCancelAction} style={{
                    padding: '8px 16px', borderRadius: 20, border: `1px solid ${S.rule}`,
                    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 11, fontWeight: 700, color: S.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>Cancel</button>
                  <button
                    onClick={onConfirm}
                    disabled={busy || (action === 'reject' && !reason.trim())}
                    style={{
                      padding: '8px 18px', borderRadius: 20, border: 'none',
                      cursor: busy || (action === 'reject' && !reason.trim()) ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: '#fff',
                      background: action === 'reject' ? S.primary : '#22c55e',
                      opacity: busy || (action === 'reject' && !reason.trim()) ? 0.6 : 1,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                    {busy
                      ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      : action === 'reject' ? <X size={12} /> : <Check size={12} />
                    }
                    {action === 'reject' ? 'Confirm Reject' : 'Confirm Approve'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onAction('reject')}
                  disabled={busy}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 22px', borderRadius: 22, border: `1px solid ${S.primary}50`,
                    background: S.primary + '10', cursor: busy ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    color: S.primary, letterSpacing: '0.1em', textTransform: 'uppercase',
                    opacity: busy ? 0.6 : 1, transition: 'all 160ms ease',
                  }}>
                  <X size={13} />
                  Reject
                </button>
                <button
                  onClick={() => onAction('approve')}
                  disabled={busy}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 22px', borderRadius: 22, border: `1px solid #22c55e60`,
                    background: '#22c55e12', cursor: busy ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase',
                    opacity: busy ? 0.6 : 1, transition: 'all 160ms ease',
                  }}>
                  <Check size={13} />
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// ── Main view ────────────────────────────────────────────────

export const ModerationView: React.FC<ModerationViewProps> = ({ user, onSignIn }) => {
  const [queue,          setQueue]          = useState<ApiModerationItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [reviewing,      setReviewing]      = useState<Record<string, boolean>>({});
  const [reviewed,       setReviewed]       = useState<Record<string, 'approved' | 'rejected'>>({});
  const [expandedAction, setExpandedAction] = useState<Record<string, 'approve' | 'reject' | null>>({});
  const [reasons,        setReasons]        = useState<Record<string, string>>({});
  const [previewId,      setPreviewId]      = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchModerationQueue()
      .then(data => { setQueue(data); setLoading(false); })
      .catch(err => { setError(err instanceof Error ? err.message : 'Failed to load queue'); setLoading(false); });
  }, []);

  useEffect(() => { if (user) load(); else setLoading(false); }, [user, load]);

  // Live updates: refresh the queue whenever a post is submitted or reviewed.
  useRealtimeTopic(user?.isAdmin ? 'moderation' : null, () => { if (user) load(); });

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
      if (previewId === item.id) setPreviewId(null);
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

  if (!user.isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
        Access denied.
      </div>
    );
  }

  const previewItem = previewId ? queue.find(q => q.id === previewId) ?? null : null;

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
            Approve or reject submissions before they go live in the feed. Click a card to open the full preview.
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
            const images = item.post.images?.length ? item.post.images : (item.post.imageUrl ? [item.post.imageUrl] : []);

            return (
              <Reveal key={item.id} delay={i * 50}>
                <div
                  onClick={() => { if (!done) setPreviewId(item.id); }}
                  style={{
                    background: S.paper, border: `1px solid ${done ? S.ruleSoft : S.rule}`,
                    borderRadius: 14, padding: '20px 22px',
                    opacity: done ? 0.55 : 1,
                    cursor: done ? 'default' : 'pointer',
                    transition: 'opacity 300ms ease, transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (done) return;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 14px 40px -16px rgba(89,46,28,0.22)';
                    e.currentTarget.style.borderColor = S.ruleMd;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = done ? S.ruleSoft : S.rule;
                  }}
                >
                  {/* Left accent */}
                  <span style={{
                    position: 'absolute', left: 0, top: 14, bottom: 14, width: 3,
                    borderRadius: '0 3px 3px 0',
                    background: done === 'approved' ? '#22c55e' : done === 'rejected' ? S.primary : typeColor,
                    opacity: 0.75,
                  }} />

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 18px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Thumbnail */}
                    {images.length > 0 && (
                      <div style={{
                        flexShrink: 0, width: 84, height: 84, borderRadius: 10,
                        overflow: 'hidden', position: 'relative', background: S.paperHi,
                        border: `1px solid ${S.ruleSoft}`,
                      }}>
                        <img src={images[0]} alt={item.post.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          referrerPolicy="no-referrer" />
                        {images.length > 1 && (
                          <span style={{
                            position: 'absolute', bottom: 4, right: 4,
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            padding: '2px 6px', borderRadius: 10,
                            background: 'rgba(0,0,0,0.65)', color: '#fff',
                            fontSize: 9.5, fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            <ImageIcon size={9} />
                            {images.length}
                          </span>
                        )}
                      </div>
                    )}

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

                      <p style={{
                        fontSize: 13, color: S.muted, lineHeight: 1.6, margin: '0 0 10px',
                        display: '-webkit-box' as React.CSSProperties['display'],
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
                        overflow: 'hidden',
                        whiteSpace: 'pre-line',
                      }}>
                        {item.post.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: S.ash }}>
                          <User size={11} />
                          {item.post.author.displayName}
                        </span>
                        {!done && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 10, fontWeight: 700, color: S.muted,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                          }}>
                            <Maximize2 size={10} />
                            Open preview
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 120 }} onClick={e => e.stopPropagation()}>
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
                    <div onClick={e => e.stopPropagation()} style={{
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

      {/* Fullscreen preview modal */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          busy={!!reviewing[previewItem.id]}
          action={expandedAction[previewItem.id] || null}
          reason={reasons[previewItem.id] || ''}
          onClose={() => setPreviewId(null)}
          onAction={(act) => openAction(previewItem.id, act)}
          onReasonChange={(v) => setReasons(prev => ({ ...prev, [previewItem.id]: v }))}
          onCancelAction={() => setExpandedAction(prev => ({ ...prev, [previewItem.id]: null }))}
          onConfirm={() => {
            const act = expandedAction[previewItem.id];
            if (!act) return;
            handleReview(previewItem, act === 'reject' ? 'rejected' : 'approved');
          }}
        />
      )}
    </div>
  );
};
