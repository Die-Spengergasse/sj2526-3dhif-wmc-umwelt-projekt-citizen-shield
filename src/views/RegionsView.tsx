import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, MessageSquare, Radio, Users, Heart,
  ShieldCheck, MapPin, ShieldAlert } from 'lucide-react';
import { S, INTENSITY } from '../design-tokens';
import { Reveal, AmbientGlow, CountUp, IntensityRing } from '../motion';
import { RegionSelector } from '../components/RegionSelector';
import { RegionMapCard } from '../components/RegionMapCard';
import { ActionButton } from '../components/ActionButton';
import { TimelineItem } from '../components/TimelineItem';
import { Region, Post, AppUser } from '../types';

interface RegionsViewProps {
  regions: Region[];
  posts: Post[];
  user: AppUser | null;
  onSignIn: () => void;
  onOpenPostForm: (user: AppUser | null, signIn: () => void) => void;
  onOpenChat: (regionId: string) => void;
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onPin?: (post: Post) => void;
  pinnedPosts?: Record<string, string | string[]>;
  onJoinRegion: (slug: string, user: AppUser | null, signIn: () => void) => void;
  joiningRegion: string | null;
  joinedRegions: string[];
  onViewChange?: (view: string) => void;
}

export const RegionsView: React.FC<RegionsViewProps> = ({
  regions, posts, user, onSignIn, onOpenPostForm, onOpenChat,
  onVote, onPin, pinnedPosts, onJoinRegion, joiningRegion, joinedRegions, onViewChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSelector, setShowSelector] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const prevIdx = useRef(0);

  const region = regions[activeIndex] || regions[0];
  const regionPosts = posts.filter(p => p.regionId === region?.slug);
  const isJoined = joinedRegions.includes(region?.slug);
  const intensity = region ? (INTENSITY[region.intensity] || INTENSITY.STABLE) : INTENSITY.STABLE;

  const go = useCallback((delta: number) => {
    setActiveIndex(i => (i + delta + regions.length) % regions.length);
  }, [regions.length]);

  useEffect(() => {
    if (prevIdx.current === activeIndex) return;
    prevIdx.current = activeIndex;
    setLoadingPosts(true);
    const t = setTimeout(() => setLoadingPosts(false), 500);
    return () => clearTimeout(t);
  }, [activeIndex]);

  if (!region) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {showSelector && (
        <RegionSelector regions={regions} activeRegionId={region.id}
          onSelect={i => setActiveIndex(i)} onClose={() => setShowSelector(false)} />
      )}

      {/* HERO */}
      <section key={region.id} style={{ position: 'relative', paddingTop: 8 }}>
        <AmbientGlow size={560} color={`${intensity.color}40`}
          style={{ top: -180, left: '40%', transform: 'translateX(-50%)', zIndex: -1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ background: intensity.color, color: '#fff', padding: '3px 12px', borderRadius: 30,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
            {region.intensity}
          </span>
          <span style={{ fontSize: 11, color: S.ash, fontWeight: 500 }}>Verified by Local Hub · live</span>
        </div>

        {/* Region nav row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={() => go(-1)} aria-label="Previous region" style={{
            width: 42, height: 42, borderRadius: '50%', border: `1px solid ${S.ruleMd}`,
            background: S.paper, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: S.ink, transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.ink; b.style.color = S.paper; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.paper; b.style.color = S.ink; }}>
            <ChevronLeft size={18} />
          </button>

          <button onClick={() => setShowSelector(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start', flex: 1, minWidth: 0,
          }}>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', fontWeight: 400, color: S.ink,
              letterSpacing: '-0.03em', lineHeight: 0.94, margin: 0, fontStyle: 'italic' }}>
              {region.name.charAt(0) + region.name.slice(1).toLowerCase()}
            </h1>
          </button>

          <button onClick={() => go(1)} aria-label="Next region" style={{
            width: 42, height: 42, borderRadius: '50%', border: `1px solid ${S.ruleMd}`,
            background: S.paper, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: S.ink, transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.ink; b.style.color = S.paper; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = S.paper; b.style.color = S.ink; }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dot nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          {regions.map((r, i) => (
            <button key={r.id} onClick={() => setActiveIndex(i)} style={{
              border: 'none', cursor: 'pointer', padding: 0, borderRadius: 4,
              width: i === activeIndex ? 30 : 8, height: 6,
              background: i === activeIndex ? S.ink : 'rgba(31,26,19,0.20)',
              transition: 'width 320ms cubic-bezier(.2,.7,.2,1), background 320ms ease',
            }} />
          ))}
        </div>

        <p style={{ fontSize: 16, color: S.muted, maxWidth: 560, lineHeight: 1.6, marginBottom: 24 }}>
          {region.description}
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => isJoined ? null : onJoinRegion(region.slug, user, onSignIn)}
            disabled={joiningRegion === region.slug}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              borderRadius: 30, border: isJoined ? `1px solid ${S.tertiary}80` : 'none',
              cursor: joiningRegion === region.slug ? 'not-allowed' : (isJoined ? 'default' : 'pointer'),
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
              color: isJoined ? S.tertiary : '#fff',
              background: isJoined ? 'transparent' : `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
              opacity: joiningRegion === region.slug ? 0.6 : 1,
              boxShadow: isJoined ? 'none' : '0 8px 22px -10px rgba(164,74,58,0.55)',
            }}>
            {joiningRegion === region.slug
              ? <><Loader2 size={14} className="animate-spin" /> Joining…</>
              : isJoined
                ? <><CheckCircle2 size={14} /> Joined</>
                : <>Offer Support</>}
          </button>
          <button onClick={() => onViewChange?.('safety')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            borderRadius: 30, border: `1px solid ${S.ruleMd}`, cursor: 'pointer',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: S.ink,
          }}>
            Safety Guide
          </button>
          <button onClick={() => onOpenChat(region.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            borderRadius: 30, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: S.paperHi, color: S.ink,
          }}>
            <MessageSquare size={14} /> Open Chat
          </button>
        </div>
      </section>

      {/* STATS */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="cs-grid-md-3">
        <Reveal>
          <div style={{ padding: '24px 26px', position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', gap: 18,
            background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
            <IntensityRing value={region.connectivity} size={88} stroke={6}
              color={intensity.color} label={`${region.connectivity}%`} sublabel="signal" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: intensity.color, textTransform: 'uppercase',
                letterSpacing: '0.18em', marginBottom: 14 }}>Intensity level</p>
              <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 34,
                color: intensity.color, letterSpacing: '-0.02em', lineHeight: 1, fontStyle: 'italic' }}>
                {intensity.label}
              </p>
              <p style={{ fontSize: 11, color: S.muted, marginTop: 8, lineHeight: 1.55 }}>
                Real-time mobilisation status confirmed by local nodes.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ padding: '22px 26px', background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.secondary, textTransform: 'uppercase',
              letterSpacing: '0.18em', marginBottom: 14 }}>Active hubs</p>
            <p style={{ fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', color: S.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>
              <CountUp end={region.activeHubs} />
            </p>
            <p style={{ fontSize: 11, color: S.ash, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.14em', marginTop: 8 }}>Verified nodes</p>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div style={{ padding: '22px 26px', background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase',
              letterSpacing: '0.18em', marginBottom: 14 }}>Connectivity</p>
            <p style={{ fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', color: S.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>
              <CountUp end={region.connectivity} />
              <span style={{ fontSize: '0.5em', color: S.ash, marginLeft: 2 }}>%</span>
            </p>
            <p style={{ fontSize: 11, color: S.ash, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.14em', marginTop: 8 }}>Network reach</p>
          </div>
        </Reveal>
      </section>

      {/* LOCAL INFO */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {[
          { title: 'Emergency contact', icon: <ShieldAlert size={14} />, color: S.primary,
            content: <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18,
              fontWeight: 500, color: S.ink, wordBreak: 'break-all' as const }}>
              {region.localInfo.emergencyContact}
            </p> },
          { title: 'Safe zones', icon: <MapPin size={14} />, color: S.secondary,
            content: (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
                {region.localInfo.safeZones.map((z, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.secondary,
                      marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: S.ink, fontWeight: 500 }}>{z}</span>
                  </li>
                ))}
              </ul>
            ) },
          { title: 'Resources', icon: <Heart size={14} />, color: S.tertiary,
            content: (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
                {region.localInfo.resources.map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.tertiary,
                      marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: S.ink, fontWeight: 500 }}>{r}</span>
                  </li>
                ))}
              </ul>
            ) },
        ].map((card, i) => (
          <Reveal key={card.title} delay={i * 100}>
            <div style={{ padding: '20px 22px', height: '100%',
              background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: card.color, textTransform: 'uppercase',
                letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                {card.icon} {card.title}
              </p>
              {card.content}
            </div>
          </Reveal>
        ))}
      </section>

      {/* TIMELINE + SIDEBAR */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="cs-grid-lg-2a1">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              Community reports
            </p>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {regionPosts.length} signals
            </span>
          </div>
          {loadingPosts ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ padding: 18, borderRadius: 14, background: S.paper, border: `1px solid ${S.rule}` }}>
                  <div style={{ height: 10, borderRadius: 8, background: S.paperLo, marginBottom: 12, width: '40%' }} />
                  <div style={{ height: 18, borderRadius: 8, background: S.paperLo, marginBottom: 10, width: '80%' }} />
                  <div style={{ height: 12, borderRadius: 8, background: S.paperLo, width: '100%' }} />
                </div>
              ))}
            </div>
          ) : regionPosts.length > 0 ? (
            regionPosts.map((post, i) => {
              const pinList = pinnedPosts?.[post.regionId];
              const isPinned = Array.isArray(pinList) ? pinList.includes(post.id) : pinList === post.id;
              return (
                <Reveal key={post.id} delay={i * 60}>
                  <TimelineItem post={post} onVote={onVote} onPin={onPin} isPinnedToCommunity={isPinned} />
                </Reveal>
              );
            })
          ) : (
            <div style={{ padding: 48, textAlign: 'center', background: S.paper,
              border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <Radio size={36} style={{ color: S.ash, opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 12, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                No reports yet
              </p>
            </div>
          )}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Reveal delay={120}>
            <RegionMapCard region={region} />
          </Reveal>

          <Reveal delay={180}>
            <div style={{ padding: 22, background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase',
                letterSpacing: '0.16em', marginBottom: 18 }}>Community tools</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ActionButton label="Join regional chat" icon={<MessageSquare size={15} />}
                  color="text-primary" onClick={() => onOpenChat(region.id)} />
                <ActionButton label="Request emergency aid" icon={<Heart size={15} />} color="text-primary" />
                <ActionButton label="Share safety update" icon={<Radio size={15} />}
                  color="text-tertiary" onClick={() => onOpenPostForm(user, onSignIn)} />
                <ActionButton label="Volunteer for local hub" icon={<Users size={15} />} color="text-secondary" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div style={{ padding: 22, background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase',
                letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={11} /> Safety · level 1
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 0, margin: 0, listStyle: 'none' }}>
                {['Check in with your local community hub daily',
                  'Share verified information only',
                  'Keep emergency supplies accessible'].map((t, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: S.primary,
                      marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 12.5, color: S.muted, lineHeight: 1.6 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </aside>
      </section>
    </div>
  );
};
