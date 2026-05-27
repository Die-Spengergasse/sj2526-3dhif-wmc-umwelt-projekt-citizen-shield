import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Router, Route, useLocation } from 'wouter';
import { TopNav } from './components/TopNav';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { PostForm } from './components/PostForm';
import { SignInModal } from './components/SignInModal';
import { HubView } from './views/HubView';
import { FeedView } from './views/FeedView';
import { SafetyView } from './views/SafetyView';
import { RegionsView } from './views/RegionsView';
import { ModerationView } from './views/ModerationView';
import { PostDetailView } from './views/PostDetailView';
import { Toaster, showToast, useNow, formatRelative } from './motion';
import { Wordmark } from './components/Wordmark';
import {
  fetchRegions, fetchRegionDetail, fetchPosts, createPost, voteOnPost,
  joinRegion, leaveRegion,
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
} from './api';
import { useAuth } from './context/AuthContext';
import { S } from './design-tokens';
import { Post, Region, PostType, Notification, AppUser, Voter } from './types';

function AppContent() {
  const { firebaseUser, dbUser, signIn, signOut, refreshDbUser } = useAuth();
  const [location, setLocation] = useLocation();

  const user: AppUser | null = firebaseUser
    ? {
        uid:         firebaseUser.uid,
        displayName: firebaseUser.displayName ?? dbUser?.displayName ?? 'User',
        email:       firebaseUser.email ?? dbUser?.email ?? '',
        photoURL:    firebaseUser.photoURL ?? undefined,
        isVerified:  dbUser?.isVerified ?? false,
        isAdmin:     dbUser?.isAdmin ?? false,
        stats: {
          totalPosts:            dbUser?.stats?.totalPosts            ?? 0,
          totalUpvotesReceived:  dbUser?.stats?.totalUpvotesReceived  ?? 0,
        },
      }
    : null;

  const [regions,         setRegions]        = useState<Region[]>([]);
  const [posts,           setPosts]          = useState<Post[]>([]);
  const [loadingPosts,    setLoadingPosts]   = useState(false);
  const [activeRegionIdx, setActiveRegionIdx]= useState(0);
  const [postFormOpen,    setPostFormOpen]   = useState(false);
  const [signInOpen,      setSignInOpen]     = useState(false);
  const [joiningRegion,   setJoiningRegion]  = useState<string | null>(null);
  const [joinedRegions,   setJoinedRegions]  = useState<string[]>([]);
  const [notifications,   setNotifications]  = useState<Notification[]>([]);

  // Track the last non-post-detail path for background rendering
  const lastBgPathRef = useRef('/');
  useEffect(() => {
    if (!location.startsWith('/post/')) {
      lastBgPathRef.current = location;
    }
  }, [location]);

  const viewPath = location.startsWith('/post/') ? lastBgPathRef.current : location;

  const now = useNow(30000);
  const displayNotifications = notifications.map(n => ({
    ...n,
    time: n._at ? formatRelative(now - n._at) : n.time,
  }));

  const activeRegion = regions[activeRegionIdx] || regions[0];

  useEffect(() => { refreshDbUser(); }, [refreshDbUser]);

  // Load regions — re-fetch when auth changes so is_joined reflects DB state
  useEffect(() => {
    fetchRegions()
      .then(data => {
        setRegions(data);
        setJoinedRegions(data.filter(r => r.isJoined).map(r => r.slug));
      })
      .catch(console.error);
  }, [user?.uid]);

  // Load region detail when active region changes
  useEffect(() => {
    if (!activeRegion) return;
    fetchRegionDetail(activeRegion.slug)
      .then(detail => setRegions(prev => prev.map(r => r.slug === detail.slug ? detail : r)))
      .catch(() => {});
  }, [activeRegion?.slug]);

  // Load posts when active region changes
  const loadPosts = useCallback((slug: string) => {
    setLoadingPosts(true);
    fetchPosts(slug)
      .then(apiPosts => {
        setPosts(prev => {
          const others = prev.filter(p => p.regionId !== slug);
          return [...apiPosts, ...others];
        });
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    if (!activeRegion) return;
    loadPosts(activeRegion.slug);
  }, [activeRegion?.slug, loadPosts]);

  // Silent re-fetch when auth resolves so userVote is populated from DB
  const activeRegionSlugRef = useRef<string | undefined>(undefined);
  activeRegionSlugRef.current = activeRegion?.slug;
  useEffect(() => {
    if (!user?.uid || !activeRegionSlugRef.current) return;
    fetchPosts(activeRegionSlugRef.current)
      .then(apiPosts => {
        setPosts(prev => {
          const others = prev.filter(p => p.regionId !== activeRegionSlugRef.current);
          return [...apiPosts, ...others];
        });
      })
      .catch(() => {});
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply ?region= query param when on /regions
  useEffect(() => {
    if (!viewPath.startsWith('/regions') || !regions.length) return;
    const search = viewPath.split('?')[1] || '';
    const slug = new URLSearchParams(search).get('region');
    if (slug) {
      const idx = regions.findIndex(r => r.slug === slug);
      if (idx !== -1) setActiveRegionIdx(idx);
    }
  }, [viewPath, regions]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewPath]);

  // Fetch notifications when logged in
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    fetchNotifications().then(setNotifications).catch(() => {});
  }, [user?.uid]);

  const handleVote = (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) { setSignInOpen(true); return; }

    // Snapshot for rollback and pre-compute next so both optimistic update and API call agree
    const prevPosts = posts;
    const target = posts.find(p => p.id === postId);
    if (!target) return;

    const old = target.userVote ?? null;
    const next: 'upvote' | 'downvote' | null = old === voteType ? null : voteType;

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;

      let upDelta = 0, downDelta = 0;
      if (old  === 'upvote')   upDelta   -= 1;
      if (old  === 'downvote') downDelta -= 1;
      if (next === 'upvote')   upDelta   += 1;
      if (next === 'downvote') downDelta += 1;

      const me: Voter = { id: user.uid, displayName: user.displayName, isVerified: user.isVerified };
      const dropMe = (list: Voter[]) => (list || []).filter(v => v.id !== user.uid);
      const addMe  = (list: Voter[]) => [...dropMe(list), me];

      let upvoters   = p.upvoters   || [];
      let downvoters = p.downvoters || [];
      if (old === 'upvote'   && next !== 'upvote')   upvoters   = dropMe(upvoters);
      if (old === 'downvote' && next !== 'downvote') downvoters = dropMe(downvoters);
      if (next === 'upvote'   && old !== 'upvote')   upvoters   = addMe(upvoters);
      if (next === 'downvote' && old !== 'downvote') downvoters = addMe(downvoters);

      return {
        ...p, userVote: next,
        upvoteCount:   Math.max(0, p.upvoteCount   + upDelta),
        downvoteCount: Math.max(0, p.downvoteCount + downDelta),
        upvoters, downvoters,
      };
    }));

    // Pass `next` (null when toggling off) — this is the fix for the toggle bug
    voteOnPost(postId, next)
      .then(result => {
        // Confirm counts from server
        setPosts(prev => prev.map(p => p.id !== postId ? p : {
          ...p,
          upvoteCount:   result.upvoteCount,
          downvoteCount: result.downvoteCount,
          userVote:      result.userVote,
        }));
        refreshDbUser();
      })
      .catch(() => {
        setPosts(prevPosts); // rollback on error
      });
  };

  const handleNewPost = async (data: { title: string; description: string; type: PostType; imageUrls?: string[]; locationText?: string; locationLat?: number; locationLng?: number }) => {
    if (!user || !activeRegion) return;
    try {
      const result = await createPost({
        regionSlug: activeRegion.slug,
        title: data.title,
        description: data.description,
        type: data.type,
        imageUrls: data.imageUrls,
        locationText: data.locationText,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
      });
      console.log('[handleNewPost] createPost response:', result);
      loadPosts(activeRegion.slug);
      refreshDbUser();
      showToast({ text: 'Report submitted for verification.', tone: 'success' });
    } catch (err) {
      console.error('[handleNewPost] createPost failed:', err);
      showToast({ text: err instanceof Error ? err.message : 'Failed to submit report. Please try again.', tone: 'ink' });
    }
  };

  const handleJoinRegion = async (slug: string, u: AppUser | null, signInFn: () => void) => {
    if (!u) { signInFn(); return; }
    setJoiningRegion(slug);
    try {
      await joinRegion(slug);
      setJoinedRegions(prev => prev.includes(slug) ? prev : [...prev, slug]);
    } catch {
      showToast({ text: 'Failed to join region. Please try again.', tone: 'ink' });
    } finally {
      setJoiningRegion(null);
    }
  };

  const handleLeaveRegion = async (slug: string) => {
    if (!user) return;
    try {
      await leaveRegion(slug);
    } catch { /* optimistic */ }
    setJoinedRegions(prev => prev.filter(s => s !== slug));
    showToast({ text: `Left ${slug.toUpperCase()} region.`, tone: 'ink' });
  };

  const handleOpenPostForm = (u: AppUser | null, signInFn: () => void) => {
    if (!u) { signInFn(); return; }
    setPostFormOpen(true);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markNotificationRead(id).catch(() => {});
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markAllNotificationsRead().catch(() => {});
  };

  const handleRegionSelect = (idx: number) => {
    setActiveRegionIdx(idx);
    const slug = regions[idx]?.slug;
    setLocation('/regions' + (slug ? `?region=${slug}` : ''));
  };

  const navigate = (view: string) => {
    const map: Record<string, string> = {
      hub: '/', regions: '/regions', feed: '/feed',
      security: '/feed', safety: '/safety', moderation: '/moderation',
    };
    setLocation(map[view] ?? `/${view}`);
  };

  const regionPosts = posts.filter(p => p.regionId === activeRegion?.slug);

  const renderView = () => {
    const base = viewPath.split('?')[0];
    if (base === '/' || base === '') {
      return (
        <HubView
          regions={regions}
          onViewChange={navigate}
          onRegionSelect={handleRegionSelect}
        />
      );
    }
    if (base === '/regions') {
      return regions.length > 0 ? (
        <RegionsView
          regions={regions} posts={posts} user={user}
          activeRegionIdx={activeRegionIdx}
          onRegionIdxChange={setActiveRegionIdx}
          onSignIn={() => setSignInOpen(true)}
          onOpenPostForm={handleOpenPostForm}
          onVote={handleVote}
          onJoinRegion={handleJoinRegion}
          onLeaveRegion={handleLeaveRegion}
          joiningRegion={joiningRegion}
          joinedRegions={joinedRegions}
          onViewChange={navigate}
        />
      ) : null;
    }
    if (base === '/feed') {
      return activeRegion ? (
        <FeedView
          posts={regionPosts} regions={regions} activeRegion={activeRegion}
          onPostClick={() => handleOpenPostForm(user, () => setSignInOpen(true))}
          onRegionSelect={setActiveRegionIdx}
          onVote={handleVote}
          loadingPosts={loadingPosts}
        />
      ) : null;
    }
    if (base === '/safety') {
      return regions.length > 0 ? (
        <SafetyView
          regions={regions}
          activeRegionIdx={activeRegionIdx}
          onRegionChange={setActiveRegionIdx}
        />
      ) : null;
    }
    if (base === '/moderation') {
      return (
        <ModerationView user={user} onSignIn={() => setSignInOpen(true)} />
      );
    }
    return (
      <HubView
        regions={regions}
        onViewChange={navigate}
        onRegionSelect={handleRegionSelect}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', color: S.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TopNav
        user={user} onSignIn={() => setSignInOpen(true)} onSignOut={signOut}
        notifications={displayNotifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />
      <Toaster />
      <Sidebar />

      {signInOpen   && <SignInModal onClose={() => setSignInOpen(false)} onSignIn={signIn} />}
      {postFormOpen && activeRegion && (
        <PostForm
          regionSlug={activeRegion.slug}
          onClose={() => setPostFormOpen(false)}
          onSubmit={handleNewPost}
        />
      )}

      {/* Post detail overlay */}
      <Route path="/post/:id">
        {(params) => (
          <PostDetailView
            postId={params.id!}
            cachedPost={posts.find(p => p.id === params.id) ?? null}
            user={user}
            onSignIn={() => setSignInOpen(true)}
            onVote={handleVote}
          />
        )}
      </Route>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 72 }}>
        <div style={{ flex: 1, paddingInline: 'clamp(16px, 4vw, 48px)', paddingTop: 32, paddingBottom: 80 }} className="cs-main-inner">
          {renderView()}
        </div>

        <footer style={{ paddingTop: 32, paddingInline: 'clamp(16px, 4vw, 48px)', borderTop: `1px solid ${S.rule}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ maxWidth: 360 }}>
              <Wordmark size="lg" />
              <p style={{ fontSize: 12, color: S.muted, marginTop: 14, lineHeight: 1.6 }}>
                A community-led signal network for verified safety information across crisis regions.
                Built by and for the people on the ground.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, auto))', gap: '4px 32px' }}>
              {['Community Guidelines', 'Mutual Aid', 'Emergency Contact', 'Privacy Policy'].map(l => (
                <a key={l} href="#" style={{
                  fontSize: 12, color: S.muted, textDecoration: 'none', fontWeight: 500,
                  padding: '6px 0', transition: 'color 180ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = S.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = S.muted)}>
                  {l}
                </a>
              ))}
            </div>
          </div>
          <p style={{
            fontSize: 10, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.18em',
            marginTop: 24, paddingTop: 16, borderTop: `1px solid ${S.ruleSoft}`,
          }}>© 2026 · Citizen Shield Network · Community powered</p>
        </footer>
      </main>

      <BottomNav user={user} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
