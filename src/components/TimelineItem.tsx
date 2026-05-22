import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'wouter';
import { AlertTriangle, Info, Radio, ThumbsUp, ThumbsDown, CircleCheck, Flag, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { S } from '../design-tokens';
import { Post, Voter } from '../types';

// ── Voter Popover ────────────────────────────────────────────

interface VoterPopoverProps {
  voters: Voter[];
  type: 'upvote' | 'downvote';
  onClose: () => void;
}

const VoterPopover: React.FC<VoterPopoverProps> = ({ voters, type, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} className="reveal-fade" style={{
      position: 'absolute', zIndex: 30, bottom: 36, left: 0, borderRadius: 14, overflow: 'hidden', width: 220,
      background: S.paper, border: `1px solid ${S.rule}`,
      boxShadow: '0 24px 60px -12px rgba(89,46,28,0.32)',
    }}>
      <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${S.ruleSoft}` }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          {type === 'upvote' ? 'Upvoted by' : 'Downvoted by'}
        </p>
      </div>
      <div style={{ padding: 6, maxHeight: 200, overflowY: 'auto' }}>
        {!voters?.length ? (
          <p style={{ fontSize: 11, color: S.ash, textAlign: 'center', padding: '12px 0' }}>No votes yet</p>
        ) : voters.slice(0, 8).map(v => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}>{v.displayName?.[0]?.toUpperCase() || '?'}</div>
            <span style={{ fontSize: 12, fontWeight: 500, color: S.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{v.displayName}</span>
            {v.isVerified && <CircleCheck size={11} style={{ color: S.secondary, flexShrink: 0 }}/>}
          </div>
        ))}
      </div>
    </div>
  );
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
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.92)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16, width: 40, height: 40,
        borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>
        <X size={18} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {idx + 1} / {images.length}
        </span>
      )}

      {/* Prev */}
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }} style={{
          position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Image */}
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

      {/* Next */}
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

// ── ImageGrid ─────────────────────────────────────────────────

interface ImageGridProps {
  images: string[];
  title: string;
  onImageClick: (idx: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, title, onImageClick }) => {
  if (images.length === 1) {
    return (
      <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 12, cursor: 'pointer' }}
        onClick={() => onImageClick(0)}>
        <div style={{ aspectRatio: '16/9' }}>
          <img src={images[0]} alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            referrerPolicy="no-referrer" />
        </div>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
        {images.map((src, i) => (
          <div key={i} style={{ aspectRatio: '4/3', cursor: 'pointer' }} onClick={() => onImageClick(i)}>
            <img src={src} alt={`${title} ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    );
  }

  // 3+ images
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ borderRadius: '10px 10px 0 0', overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => onImageClick(0)}>
        <div style={{ aspectRatio: '16/9' }}>
          <img src={images[0]} alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            referrerPolicy="no-referrer" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
        {images.slice(1).map((src, i) => (
          <div key={i} style={{ flex: 1, aspectRatio: '1/1', borderRadius: i === 0 ? '0 0 0 10px' : i === images.slice(1).length - 1 ? '0 0 10px 0' : 0, overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => onImageClick(i + 1)}>
            <img src={src} alt={`${title} ${i + 2}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TimelineItem ──────────────────────────────────────────────

interface TimelineItemProps {
  post: Post;
  onVote?: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onPin?: (post: Post) => void;
  isPinnedToCommunity?: boolean;
  currentUser?: { uid: string } | null;
  highlighted?: boolean;
  noClick?: boolean;
  noHover?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ post, onVote, onPin, isPinnedToCommunity, highlighted, noClick, noHover }) => {
  const { id, time, title, description, type, image, images, tags, upvoteCount, downvoteCount, userVote, author, upvoters = [], downvoters = [], locationText, locationLat, locationLng } = post;
  const displayImages = images?.length ? images : (image ? [image] : []);
  const [openPopover, setOpenPopover] = useState<'upvote' | 'downvote' | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  const typeConfig = {
    critical:  { color: S.primary,   tone: 'rgba(164,74,58,0.10)',  label: 'Critical',  Icon: AlertTriangle },
    info:      { color: S.secondary, tone: 'rgba(61,107,120,0.10)', label: 'Info',      Icon: Info },
    broadcast: { color: S.tertiary,  tone: 'rgba(122,142,90,0.10)', label: 'Broadcast', Icon: Radio },
  } as const;
  const tc = typeConfig[type] || typeConfig.info;

  const locationLabel = locationText
    ? locationText
    : (locationLat != null && locationLng != null)
      ? `~${locationLat.toFixed(2)}, ${locationLng.toFixed(2)}`
      : null;

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox images={displayImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
      <article style={{
        position: 'relative', marginBottom: 14, borderRadius: 14, overflow: 'visible',
        background: S.paper, border: `1px solid ${highlighted ? S.secondary : S.rule}`,
        boxShadow: highlighted ? `0 0 0 2px ${S.secondary}40` : 'none',
        transition: noHover ? 'none' : 'transform 280ms cubic-bezier(.2,.7,.2,1), box-shadow 280ms cubic-bezier(.2,.7,.2,1), border-color 280ms ease',
      }}
      onMouseEnter={e => { if (noHover) return; e.currentTarget.style.transform = 'translateY(-2px)'; if (!highlighted) { e.currentTarget.style.boxShadow = '0 14px 40px -16px rgba(89,46,28,0.24)'; e.currentTarget.style.borderColor = S.ruleMd; } }}
      onMouseLeave={e => { if (noHover) return; e.currentTarget.style.transform = 'translateY(0)'; if (!highlighted) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = S.rule; } }}>
        <span style={{
          position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderRadius: '0 3px 3px 0',
          background: tc.color, opacity: type === 'critical' ? 1 : 0.7,
        }}/>
        <div style={{ padding: '18px 20px 14px 22px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', color: tc.color }}><tc.Icon size={14}/></span>
              <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{tc.label}</span>
              <span style={{ fontSize: 11, color: S.ash, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>· {time}</span>
            </div>
            {author && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${S.primary}30, ${S.primary}10)`,
                    color: S.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                  }}>{author.displayName?.[0]?.toUpperCase() || '?'}</div>
                  <span style={{ fontSize: 11.5, color: S.muted, fontWeight: 500 }}>{author.displayName}</span>
                  {author.isVerified && <CircleCheck size={11} style={{ color: S.secondary }}/>}
                </div>
                {locationLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={10} style={{ color: S.ash, flexShrink: 0 }}/>
                    <span style={{ fontSize: 10.5, color: S.ash, fontStyle: 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {locationLabel}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <h4
            onClick={() => { if (!noClick) setLocation(`/post/${id}`); }}
            style={{
              fontFamily: type === 'broadcast' ? "'Instrument Serif', Georgia, serif" : "'Plus Jakarta Sans', sans-serif",
              fontSize: type === 'broadcast' ? 22 : 17,
              fontWeight: type === 'broadcast' ? 400 : 700,
              fontStyle: type === 'broadcast' ? 'italic' : 'normal',
              color: S.ink, letterSpacing: '-0.015em', lineHeight: 1.25, marginBottom: 8, marginTop: 0,
              cursor: noClick ? 'default' : 'pointer',
            }}
            onMouseEnter={e => { if (!noClick) e.currentTarget.style.color = S.primary; }}
            onMouseLeave={e => { e.currentTarget.style.color = S.ink; }}
          >
            {type === 'broadcast' ? `"${title}"` : title}
          </h4>

          <p
            onClick={() => { if (!noClick) setLocation(`/post/${id}`); }}
            style={{
              fontSize: 13.5, color: S.inkSoft, lineHeight: 1.65,
              marginBottom: (displayImages.length > 0 || tags?.length) ? 12 : 0,
              cursor: noClick ? 'default' : 'pointer',
            }}
          >
            {description}
          </p>

          {displayImages.length > 0 && (
            <ImageGrid images={displayImages} title={title} onImageClick={setLightboxIdx} />
          )}

          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 600, color: S.muted, background: S.paperHi,
                  padding: '3px 9px', borderRadius: 30, letterSpacing: '0.02em', border: `1px solid ${S.ruleSoft}`,
                }}>#{tag}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 12, borderTop: `1px solid ${S.ruleSoft}` }}>
            {([
              { kind: 'upvote'   as const, count: upvoteCount,   Icon: ThumbsUp,   voters: upvoters,   activeColor: S.secondary },
              { kind: 'downvote' as const, count: downvoteCount, Icon: ThumbsDown, voters: downvoters, activeColor: S.primary   },
            ]).map(({ kind, count, Icon, voters: vl, activeColor }) => {
              const isActive = userVote === kind;
              return (
                <div key={kind} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => onVote?.(id, kind)}
                    style={{
                      width: 30, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', color: isActive ? activeColor : S.ash, transition: 'all 180ms ease',
                    }}>
                    <Icon size={14}/>
                  </button>
                  <button onClick={e => { e.stopPropagation(); setOpenPopover(p => p === kind ? null : kind); }}
                    style={{
                      minWidth: 24, padding: '0 6px', height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                      background: 'transparent', color: isActive ? activeColor : S.muted, transition: 'all 180ms ease',
                    }}>
                    {count}
                  </button>
                  {openPopover === kind && (
                    <VoterPopover voters={vl} type={kind} onClose={() => setOpenPopover(null)}/>
                  )}
                </div>
              );
            })}
            {onPin && (
              <button onClick={() => onPin(post)}
                style={{
                  marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', height: 28, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: isPinnedToCommunity ? S.primary : S.muted,
                  background: isPinnedToCommunity ? 'rgba(164,74,58,0.10)' : 'transparent',
                  border: `1px solid ${isPinnedToCommunity ? 'rgba(164,74,58,0.35)' : S.rule}`,
                  transition: 'all 180ms ease',
                }}>
                <Flag size={11}/>
                <span>{isPinnedToCommunity ? 'Pinned' : 'Pin'}</span>
              </button>
            )}
          </div>
        </div>
      </article>
    </>
  );
};
