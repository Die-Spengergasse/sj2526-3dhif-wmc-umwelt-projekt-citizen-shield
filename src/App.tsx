import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { PostForm } from './components/PostForm';
import { SignInModal } from './components/SignInModal';
import { HubView } from './views/HubView';
import { FeedView } from './views/FeedView';
import { SafetyView } from './views/SafetyView';
import { RegionsView } from './views/RegionsView';
import { CommunityView } from './views/CommunityView';
import { GlobeView } from './views/GlobeView';
import { Toaster, showToast, useNow, parseRelative, formatRelative } from './motion';
import { Wordmark } from './components/Wordmark';
import { fetchRegions, fetchRegionDetail, fetchPosts, createPost, voteOnPost, joinRegion } from './api';
import { useAuth } from './context/AuthContext';
import { S } from './design-tokens';
import { Post, Region, PostType, Notification, Comment, AppUser } from './types';

type View = 'hub' | 'regions' | 'globe' | 'security' | 'safety' | 'community';

export default function App() {
  const { firebaseUser, dbUser, signIn, signOut } = useAuth();

  const user: AppUser | null = firebaseUser
    ? {
        uid:         firebaseUser.uid,
        displayName: firebaseUser.displayName ?? dbUser?.displayName ?? 'User',
        email:       firebaseUser.email ?? dbUser?.email ?? '',
        photoURL:    firebaseUser.photoURL ?? undefined,
        isVerified:  dbUser?.isVerified ?? false,
        stats: {
          totalPosts:            dbUser?.stats?.totalPosts            ?? 0,
          totalUpvotesReceived:  dbUser?.stats?.totalUpvotesReceived  ?? 0,
        },
      }
    : null;

  const [view,            setView]           = useState<View>('hub');
  const [regions,         setRegions]        = useState<Region[]>([]);
  const [posts,           setPosts]          = useState<Post[]>([]);
  const [loadingPosts,    setLoadingPosts]   = useState(false);
  const [activeRegionIdx, setActiveRegionIdx]= useState(0);
  const [chatRegion,      setChatRegion]     = useState<string | null>(null);
  const [postFormOpen,    setPostFormOpen]   = useState(false);
  const [signInOpen,      setSignInOpen]     = useState(false);
  const [joiningRegion,   setJoiningRegion]  = useState<string | null>(null);
  const [joinedRegions,   setJoinedRegions]  = useState<string[]>([]);
  const [pinnedPosts,     setPinnedPosts]    = useState<Record<string, string | string[]>>({});
  const [comments,        setComments]       = useState<Record<string, Comment[]>>({});
  const [notifications,   setNotifications]  = useState<Notification[]>([]);

  const now = useNow(30000);
  const displayNotifications = notifications.map(n => ({
    ...n,
    time: n._at ? formatRelative(now - n._at) : n.time,
  }));

  const activeRegion = regions[activeRegionIdx] || regions[0];

  // Load regions on mount
  useEffect(() => {
    fetchRegions().then(setRegions).catch(console.error);
  }, []);

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

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleVote = (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) { setSignInOpen(true); return; }

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const old  = p.userVote;
      const next = old === voteType ? null : voteType;

      let upDelta = 0, downDelta = 0;
      if (old  === 'upvote')   upDelta   -= 1;
      if (old  === 'downvote') downDelta -= 1;
      if (next === 'upvote')   upDelta   += 1;
      if (next === 'downvote') downDelta += 1;

      const me = { id: user.uid, displayName: user.displayName, isVerified: user.isVerified };
      const dropMe = (list: typeof p.upvoters) => (list || []).filter(v => v.id !== user.uid);
      const addMe  = (list: typeof p.upvoters) => [...dropMe(list), me];

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

    voteOnPost(postId, voteType).catch(() => {});
  };

  const handleNewPost = async (data: { title: string; description: string; type: PostType; imageUrl?: string }) => {
    if (!user || !activeRegion) return;
    try {
      await createPost({
        regionSlug: activeRegion.slug,
        title: data.title,
        description: data.description,
        type: data.type,
        imageUrl: data.imageUrl,
      });
      loadPosts(activeRegion.slug);
    } catch {
      const fallback: Post = {
        id: 'new-' + Date.now(), regionId: activeRegion.slug, time: 'Just now',
        title: data.title, description: data.description, type: data.type,
        image: data.imageUrl || undefined, upvoteCount: 0, downvoteCount: 0, userVote: null,
        upvoters: [], downvoters: [], tags: [],
        author: { id: user.uid, displayName: user.displayName, avatarUrl: null, isVerified: user.isVerified },
      };
      setPosts(prev => [fallback, ...prev]);
    }
    setNotifications(prev => [
      { id: 'n-new-' + Date.now(), text: `Your report "${data.title}" submitted for verification`, _at: Date.now(), read: false, time: 'Just now' },
      ...prev,
    ]);
    showToast({ text: 'Report submitted for verification.', tone: 'success' });
  };

  const handlePinPost = (post: Post) => {
    if (!user) { setSignInOpen(true); return; }
    const slug = post.regionId;
    // Compute isPinned from current snapshot — side effects must stay outside the updater
    // to avoid double-firing in React StrictMode (updaters are called twice in dev).
    const cur = Array.isArray(pinnedPosts[slug])
      ? pinnedPosts[slug] as string[]
      : pinnedPosts[slug] ? [pinnedPosts[slug] as string] : [];
    const isPinned = cur.includes(post.id);

    setPinnedPosts(prev => {
      const c = Array.isArray(prev[slug]) ? prev[slug] as string[] : (prev[slug] ? [prev[slug] as string] : []);
      const next = c.includes(post.id) ? c.filter(id => id !== post.id) : [post.id, ...c];
      return { ...prev, [slug]: next };
    });

    showToast(isPinned
      ? { text: `Unpinned from ${slug?.toUpperCase()} Community.`, tone: 'ink' }
      : { text: `Pinned to ${slug?.toUpperCase()} Community. Tap Community to discuss.`, tone: 'primary' });
    if (!isPinned) {
      setNotifications(prev => [
        { id: 'n-pin-' + Date.now(), text: `"${post.title}" was pinned for community discussion`, _at: Date.now(), read: false, time: 'Just now' },
        ...prev,
      ]);
    }
  };

  const handleJoinRegion = async (slug: string, u: AppUser | null, signInFn: () => void) => {
    if (!u) { signInFn(); return; }
    setJoiningRegion(slug);
    try {
      await joinRegion(slug);
    } catch {
      await new Promise(r => setTimeout(r, 900));
    }
    setJoinedRegions(prev => [...prev, slug]);
    setJoiningRegion(null);
  };

  const handleOpenPostForm = (u: AppUser | null, signInFn: () => void) => {
    if (!u) { signInFn(); return; }
    setPostFormOpen(true);
  };

  const handleAddComment = (postId: string, comment: Comment) => {
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
  };

  const handleMarkNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const handleMarkAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const regionPosts = posts.filter(p => p.regionId === activeRegion?.slug);

  return (
    <div style={{ minHeight: '100vh', color: S.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TopNav
        currentView={view} onViewChange={v => setView(v as View)}
        user={user} onSignIn={() => setSignInOpen(true)} onSignOut={signOut}
        notifications={displayNotifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />
      <Toaster />
      <Sidebar />

      {signInOpen   && <SignInModal onClose={() => setSignInOpen(false)} onSignIn={signIn} />}
      {postFormOpen && activeRegion && (
        <PostForm regionSlug={activeRegion.slug} onClose={() => setPostFormOpen(false)} onSubmit={handleNewPost} />
      )}
      {chatRegion && (
        <Chat region={chatRegion} currentUser={user} onClose={() => setChatRegion(null)} />
      )}

      <main style={{ paddingTop: 80, paddingBottom: 120, position: 'relative', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }} className="cs-main-inner">
          <div key={view}>
            {view === 'hub' && (
              <HubView regions={regions} onViewChange={v => setView(v as View)} />
            )}
            {view === 'globe' && (
              <GlobeView
                regions={regions}
                onRegionSelect={i => setActiveRegionIdx(i)}
                onViewChange={v => setView(v as View)}
              />
            )}
            {view === 'regions' && regions.length > 0 && (
              <RegionsView
                regions={regions} posts={posts} user={user}
                onSignIn={() => setSignInOpen(true)}
                onOpenPostForm={handleOpenPostForm}
                onOpenChat={id => setChatRegion(id)}
                onVote={handleVote}
                onPin={handlePinPost} pinnedPosts={pinnedPosts}
                onJoinRegion={handleJoinRegion}
                joiningRegion={joiningRegion}
                joinedRegions={joinedRegions}
                onViewChange={v => setView(v as View)}
              />
            )}
            {view === 'security' && activeRegion && (
              <FeedView
                posts={regionPosts} regions={regions} activeRegion={activeRegion}
                onPostClick={() => handleOpenPostForm(user, () => setSignInOpen(true))}
                onRegionSelect={setActiveRegionIdx}
                onVote={handleVote}
                onPin={handlePinPost} pinnedPosts={pinnedPosts}
                loadingPosts={loadingPosts}
              />
            )}
            {view === 'safety' && activeRegion && (
              <SafetyView activeRegion={activeRegion} />
            )}
            {view === 'community' && (
              <CommunityView
                regions={regions} posts={posts}
                pinnedPosts={pinnedPosts} comments={comments}
                user={user} onSignIn={() => setSignInOpen(true)}
                onAddComment={handleAddComment} onVote={handleVote}
                onPin={handlePinPost}
              />
            )}
          </div>

          <footer style={{ marginTop: 96, paddingTop: 32, borderTop: `1px solid ${S.rule}` }}>
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
        </div>
      </main>

      <BottomNav currentView={view} onViewChange={v => setView(v as View)} />
    </div>
  );
}
