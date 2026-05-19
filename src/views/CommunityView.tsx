import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Flag, X, Send, LogIn, Loader2, MessageSquare, ChevronRight, CircleCheck } from 'lucide-react';
import { S, INTENSITY } from '../design-tokens';
import { Reveal, AmbientGlow } from '../motion';
import { TimelineItem } from '../components/TimelineItem';
import { Post, Region, Comment, AppUser } from '../types';
import { fetchComments, createComment } from '../api';

interface DiscussionDrawerProps {
  post: Post;
  region: Region | undefined;
  comments: Comment[];
  user: AppUser | null;
  onSignIn: () => void;
  onAddComment: (postId: string, comment: Comment) => void;
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onPin?: (post: Post) => void;
  onClose: () => void;
}

const DiscussionDrawer: React.FC<DiscussionDrawerProps> = ({
  post, region, comments: initialComments, user, onSignIn, onAddComment, onVote, onPin, onClose,
}) => {
  const [localComments, setLocalComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Load comments from API when the drawer opens
  useEffect(() => {
    fetchComments(post.id)
      .then(apiComments => setLocalComments(apiComments))
      .catch(() => {});
  }, [post.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [localComments.length]);

  const handleComment = async () => {
    if (!commentText.trim() || !user || submitting) return;
    setSubmitting(true);
    const text = commentText.trim();
    try {
      const saved = await createComment(post.id, text);
      setLocalComments(prev => [...prev, saved]);
      onAddComment(post.id, saved); // update parent count
    } catch {
      // Fallback: add optimistically
      const optimistic: Comment = {
        id: 'c-' + Date.now(), userId: user.uid, name: user.displayName,
        text, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        isVerified: user.isVerified,
      };
      setLocalComments(prev => [...prev, optimistic]);
      onAddComment(post.id, optimistic);
    }
    setCommentText('');
    setSubmitting(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <div onClick={onClose} className="reveal-fade" style={{
        position: 'fixed', inset: 0, zIndex: 180,
        background: 'rgba(31,26,19,0.45)', backdropFilter: 'blur(6px)',
      }} />
      <aside className="cs-drawer-in" role="dialog" aria-label="Discussion" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 181,
        width: 'min(520px, 100vw)', display: 'flex', flexDirection: 'column',
        background: S.paper, borderLeft: `1px solid ${S.rule}`,
        boxShadow: '-32px 0 80px -16px rgba(31,26,19,0.45)',
      }}>
        <header style={{
          flexShrink: 0, padding: '18px 20px 14px',
          borderBottom: `1px solid ${S.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Flag size={13} style={{ color: S.primary, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              Pinned · {region?.name || ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {onPin && user && (
              <button onClick={() => { onPin(post); onClose(); }} title="Unpin from Community"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 8,
                  border: `1px solid ${S.rule}`, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 10.5, fontWeight: 700, color: S.muted, letterSpacing: '0.12em', textTransform: 'uppercase',
                  transition: 'all 180ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = S.paperHi; (e.currentTarget as HTMLButtonElement).style.color = S.ink; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = S.muted; }}>
                <Flag size={11} /> Unpin
              </button>
            )}
            <button onClick={onClose} aria-label="Close discussion" style={{
              width: 34, height: 34, borderRadius: 8, border: `1px solid ${S.rule}`,
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: S.muted,
              transition: 'all 180ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = S.paperHi; (e.currentTarget as HTMLButtonElement).style.color = S.ink; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = S.muted; }}>
              <X size={16} />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 14px' }}>
          <TimelineItem post={post} onVote={onVote} />

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18, marginBottom: 12 }}>
            <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: S.ink, letterSpacing: '-0.02em', fontStyle: 'italic' }}>
              Discussion
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {localComments.length} {localComments.length === 1 ? 'reply' : 'replies'}
            </span>
          </div>

          {localComments.length === 0 ? (
            <div style={{ padding: '32px 0 8px', textAlign: 'center' }}>
              <MessageSquare size={32} style={{ color: S.ash, opacity: 0.25, display: 'block', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 11, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                Be the first to reply
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {localComments.map((c, i) => (
                <Reveal key={c.id} delay={i * 40}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${S.primary}30, ${S.primary}10)`,
                      color: S.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12, flexShrink: 0,
                    }}>{c.name?.[0]?.toUpperCase() || '?'}</div>
                    <div style={{ flex: 1, background: S.paperHi, borderRadius: 12, padding: '10px 14px', border: `1px solid ${S.ruleSoft}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 12.5, color: S.ink }}>{c.name}</span>
                          {c.isVerified && <CircleCheck size={11} style={{ color: S.secondary }} />}
                        </div>
                        <span style={{ fontSize: 10, color: S.ash, fontFamily: "'JetBrains Mono', monospace" }}>{c.time}</span>
                      </div>
                      <p style={{ fontSize: 13, color: S.inkSoft, lineHeight: 1.6 }}>{c.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: 14, borderTop: `1px solid ${S.ruleSoft}`, flexShrink: 0, background: S.paper }}>
          {user ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={inputRef} value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                placeholder="Add a comment…"
                style={{
                  flex: 1, background: S.paperHi, border: `1px solid ${S.rule}`, borderRadius: 30,
                  padding: '10px 16px', fontSize: 13, color: S.ink, outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 180ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = S.ruleMd)}
                onBlur={e => (e.currentTarget.style.borderColor = S.rule)} />
              <button onClick={handleComment} disabled={!commentText.trim() || submitting}
                aria-label="Send comment"
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none',
                  background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
                  color: '#fff', cursor: !commentText.trim() || submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  opacity: !commentText.trim() || submitting ? 0.4 : 1, transition: 'all 200ms ease',
                  boxShadow: '0 4px 14px -6px rgba(164,74,58,0.55)',
                }}>
                {submitting ? <Loader2 size={15} /> : <Send size={15} />}
              </button>
            </div>
          ) : (
            <button onClick={onSignIn} style={{
              width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '10px 18px', borderRadius: 30,
              border: `1px solid ${S.ruleMd}`, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: S.ink,
            }}>
              <LogIn size={13} /> Sign in to comment
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

interface CommunityViewProps {
  regions: Region[];
  posts: Post[];
  pinnedPosts: Record<string, string[]>;
  comments: Record<string, Comment[]>;
  user: AppUser | null;
  onSignIn: () => void;
  onAddComment: (postId: string, comment: Comment) => void;
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onPin?: (post: Post) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  regions, posts, pinnedPosts, comments, user, onSignIn, onAddComment, onVote, onPin,
}) => {
  const [activeTab, setActiveTab] = useState(regions[0]?.slug || 'nepal');
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const activeRegion = regions.find(r => r.slug === activeTab) || regions[0];

  const pinned = useMemo(() => {
    const ids = pinnedPosts?.[activeTab] || [];
    return ids.map(id => posts.find(p => p.id === id)).filter(Boolean) as Post[];
  }, [pinnedPosts, posts, activeTab]);

  const openPost   = openPostId ? posts.find(p => p.id === openPostId) : null;
  const openRegion = openPost   ? regions.find(r => r.slug === openPost.regionId) : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* HERO */}
      <section style={{ position: 'relative' }}>
        <AmbientGlow size={420} color="rgba(61,107,120,0.28)" style={{ top: -140, right: '25%', zIndex: -1 }} />
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.secondary, textTransform: 'uppercase',
            letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'currentColor',
              verticalAlign: 'middle', opacity: 0.5 }} />
            Community Hub
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', fontWeight: 400, color: S.ink,
            letterSpacing: '-0.03em', lineHeight: 0.94, margin: 0 }}>
            Conversations<br />
            <em style={{ fontStyle: 'italic', color: S.secondary }}>on the ground.</em>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p style={{ fontSize: 16, color: S.muted, maxWidth: 560, lineHeight: 1.6, marginTop: 20 }}>
            Pinned reports, opened up for discussion. Tap any post to join the thread.
          </p>
        </Reveal>
      </section>

      {/* Region tabs with pinned counts */}
      <Reveal>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
          {regions.map(r => {
            const cnt = (pinnedPosts?.[r.slug] || []).length;
            const intensity = INTENSITY[r.intensity] || INTENSITY.STABLE;
            return (
              <button key={r.slug} onClick={() => setActiveTab(r.slug)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                borderRadius: 30, border: `1px solid ${activeTab === r.slug ? S.ink : S.rule}`,
                background: activeTab === r.slug ? S.ink : 'transparent',
                color: activeTab === r.slug ? S.paper : S.ink,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.04em', whiteSpace: 'nowrap', transition: 'all 180ms ease',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: intensity.color }} />
                {r.name}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 30,
                  background: activeTab === r.slug ? 'rgba(251,247,236,0.18)' : S.paperHi,
                  color: activeTab === r.slug ? S.paper : S.muted,
                  letterSpacing: '0.12em',
                }}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Pinned posts grid */}
      {pinned.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {pinned.map((p, i) => {
            const replies = (comments?.[p.id] || []).length;
            const conf = ({ critical: S.primary, info: S.secondary, broadcast: S.tertiary } as Record<string, string>)[p.type] || S.secondary;
            return (
              <Reveal key={p.id} delay={i * 70}>
                <button onClick={() => setOpenPostId(p.id)} className="lift" style={{
                  width: '100%', textAlign: 'left', position: 'relative',
                  background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 14,
                  padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180,
                  transition: 'transform 280ms cubic-bezier(.2,.7,.2,1), box-shadow 280ms ease, border-color 280ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 18px 44px -16px rgba(89,46,28,0.28)'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.ruleMd; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.rule; }}>
                  <span style={{
                    position: 'absolute', left: 0, top: 14, bottom: 14, width: 3,
                    borderRadius: '0 3px 3px 0', background: conf, opacity: 0.75,
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Flag size={11} style={{ color: S.primary }} />
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: S.primary, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Pinned</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: conf, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                        · {p.type}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: S.ash, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>
                      {p.time}
                    </span>
                  </div>
                  <h4 style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700,
                    color: S.ink, letterSpacing: '-0.01em', lineHeight: 1.3, margin: 0,
                  }}>{p.title}</h4>
                  <p style={{
                    fontSize: 13, color: S.muted, lineHeight: 1.55, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  } as React.CSSProperties}>{p.description}</p>
                  <div style={{
                    marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    paddingTop: 10, borderTop: `1px solid ${S.ruleSoft}`,
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: S.muted }}>
                      <MessageSquare size={13} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>
                        {replies} {replies === 1 ? 'reply' : 'replies'}
                      </span>
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, color: S.primary,
                      fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
                    }}>
                      Open discussion <ChevronRight size={12} />
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: 48, textAlign: 'center', background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
          <Flag size={40} style={{ color: S.ash, opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: S.ink, fontWeight: 500, marginBottom: 6 }}>
            Nothing pinned in {activeRegion?.name} yet
          </p>
          <p style={{ fontSize: 11, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Tap the Pin button on any report to open it up for discussion
          </p>
        </div>
      )}

      {openPost && (
        <DiscussionDrawer
          post={openPost}
          region={openRegion}
          comments={comments?.[openPost.id] || []}
          user={user}
          onSignIn={onSignIn}
          onAddComment={onAddComment}
          onVote={onVote}
          onPin={onPin}
          onClose={() => setOpenPostId(null)}
        />
      )}
    </div>
  );
};
