import React, { useEffect, useState, useRef, Fragment } from 'react';

function formatText(text: string) {
  return text.split('\n\n').map((paragraph, i) => (
    <p key={i} style={{ marginBottom: '10px' }}>
      {paragraph.split('\n').map((line, j, arr) => (
        <Fragment key={j}>
          {line}
          {j < arr.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  ));
}
import ReactDOM from 'react-dom';
import { ArrowLeft, X, Send, Loader2, CircleCheck } from 'lucide-react';
import { S } from '../design-tokens';
import { TimelineItem } from '../components/TimelineItem';
import { Post, Comment, AppUser } from '../types';
import { fetchPost, fetchComments, createComment } from '../api';
import { useRealtimeTopic } from '../context/RealtimeContext';

interface PostDetailViewProps {
  postId: string;
  cachedPost: Post | null;
  user: AppUser | null;
  onSignIn: () => void;
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  postId, cachedPost, user, onSignIn, onVote,
}) => {
  const [post, setPost] = useState<Post | null>(cachedPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingPost, setLoadingPost] = useState(!cachedPost);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => window.history.back();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflowY = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflowY = '';
    };
  }, []);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!cachedPost) {
      setLoadingPost(true);
      fetchPost(postId)
        .then(p => { setPost(p); setLoadingPost(false); })
        .catch(() => setLoadingPost(false));
    } else {
      setPost(cachedPost);
      setLoadingPost(false);
    }
  }, [postId, cachedPost]);

  useEffect(() => {
    setLoadingComments(true);
    fetchComments(postId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [postId]);

  // Live updates: new comments appended, vote counts refreshed, post deletes reflected.
  useRealtimeTopic(`post:${postId}`, (e) => {
    if (e.type === 'comment:created') {
      fetchComments(postId).then(setComments).catch(() => {});
    } else if (e.type === 'vote:changed' || e.type === 'post:updated') {
      fetchPost(postId).then(setPost).catch(() => {});
    } else if (e.type === 'post:deleted') {
      setPost(null);
    }
  });

  const handleSubmitComment = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const comment = await createComment(postId, commentText.trim());
      setComments(prev => [...prev, comment]);
      setCommentText('');
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmitComment(e);
    }
  };

  const postContent = loadingPost ? (
    <div style={{ padding: '60px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: S.muted }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14 }}>Loading…</span>
    </div>
  ) : post ? (
    <div style={{ padding: '16px 16px 0' }}>
      <TimelineItem post={post} onVote={onVote} noClick noHover />
    </div>
  ) : (
    <div style={{ padding: '60px 24px', textAlign: 'center', color: S.ash, fontSize: 14 }}>
      Post not found.
    </div>
  );

  const commentInput = user ? (
    <form
      onSubmit={handleSubmitComment}
      style={{
        padding: '14px 18px', borderBottom: `1px solid ${S.ruleSoft}`,
        display: 'flex', gap: 12, alignItems: 'flex-end',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
      }}>
        {user.displayName?.[0]?.toUpperCase() || 'U'}
      </div>
      <textarea
        ref={textareaRef}
        value={commentText}
        onChange={e => setCommentText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment… (Enter to send)"
        rows={2}
        style={{
          flex: 1, background: S.paperHi, border: `1px solid ${S.rule}`,
          borderRadius: 10, padding: '8px 12px', fontSize: 13, color: S.ink,
          outline: 'none', resize: 'none', fontFamily: 'inherit',
          transition: 'border-color 160ms ease',
        }}
        onFocus={e => (e.target.style.borderColor = S.primary)}
        onBlur={e => (e.target.style.borderColor = S.rule)}
      />
      <button
        type="submit"
        disabled={!commentText.trim() || submitting}
        style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: !commentText.trim() || submitting ? S.paperHi : S.primary,
          color: !commentText.trim() || submitting ? S.ash : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 160ms ease',
        }}
      >
        {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
      </button>
    </form>
  ) : (
    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${S.ruleSoft}` }}>
      <button
        onClick={onSignIn}
        style={{
          width: '100%', padding: '10px', borderRadius: 10, border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
          color: '#fff', background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
        }}
      >
        Sign in to comment
      </button>
    </div>
  );

  const commentsList = (
    <div>
      {loadingComments ? (
        <div style={{ padding: '24px', textAlign: 'center', color: S.ash, fontSize: 13 }}>
          Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: S.ash, fontSize: 13 }}>
          No comments yet — be the first.
        </div>
      ) : comments.map((c, i) => (
        <div
          key={c.id}
          style={{
            padding: '14px 18px',
            borderBottom: i < comments.length - 1 ? `1px solid ${S.ruleSoft}` : 'none',
            display: 'flex', gap: 12,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${S.secondary} 0%, ${S.secondary}cc 100%)`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>
            {c.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: S.ink }}>{c.name}</span>
              {c.isVerified && <CircleCheck size={11} style={{ color: S.secondary, flexShrink: 0 }} />}
              <span style={{
                fontSize: 10, color: S.ash, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em',
              }}>{c.time}</span>
            </div>
            <div style={{ fontSize: 13, color: S.inkSoft, lineHeight: 1.6 }}>{formatText(c.text)}</div>
          </div>
        </div>
      ))}
      {comments.length > 0 && <div style={{ height: 8 }} />}
    </div>
  );

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(31,26,19,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(8px, 2vw, 24px)',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isDesktop ? 'calc(100vw - 32px)' : 680,
          height: isDesktop ? '90vh' : undefined,
          maxHeight: isDesktop ? undefined : '90vh',
          display: 'flex', flexDirection: 'column',
          background: S.paper, borderRadius: 20,
          border: `1px solid ${S.rule}`,
          boxShadow: '0 40px 100px -16px rgba(89,46,28,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0,
          padding: '14px 18px', borderBottom: `1px solid ${S.rule}`,
          background: 'rgba(251,247,236,0.96)', backdropFilter: 'blur(14px)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <button onClick={handleClose} style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${S.rule}`,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: S.muted, transition: 'all 160ms ease', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = S.paperHi; e.currentTarget.style.color = S.ink; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.muted; }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 17, color: S.ink, flex: 1 }}>Report</span>
          <button onClick={handleClose} style={{
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

        {isDesktop ? (
          /* Desktop: two-column layout */
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left column: post content, scrollable */}
            <div style={{ flex: '0 0 70%', overflowY: 'auto' }}>
              {postContent}
            </div>
            {/* Right column: comment input pinned top + scrollable comments */}
            <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1f1f1f' }}>
              <div style={{ flexShrink: 0 }}>
                {commentInput}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {commentsList}
              </div>
            </div>
          </div>
        ) : (
          /* Mobile: single-column layout */
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {postContent}
            <div style={{ height: 1, background: S.rule, margin: '0 16px' }} />
            {commentInput}
            {commentsList}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
