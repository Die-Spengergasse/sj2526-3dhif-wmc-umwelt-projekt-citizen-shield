import React, { useState, useMemo } from 'react';
import { Radio } from 'lucide-react';
import { S, INTENSITY } from '../design-tokens';
import { Reveal, AmbientGlow, Skeleton, IntensityRing, LiveDot } from '../motion';
import { TimelineItem } from '../components/TimelineItem';
import { Post, Region } from '../types';

interface FeedViewProps {
  posts: Post[];
  regions: Region[];
  activeRegion: Region;
  onPostClick: () => void;
  onRegionSelect: (index: number) => void;
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onPin?: (post: Post) => void;
  pinnedPosts?: Record<string, string | string[]>;
  loadingPosts: boolean;
}

type FilterType = 'all' | 'critical' | 'info' | 'broadcast';

const RegionPill: React.FC<{ region: Region; active: boolean; onClick: () => void }> = ({ region, active, onClick }) => {
  const intensity = INTENSITY[region.intensity] || INTENSITY.STABLE;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 30,
      border: `1px solid ${active ? S.ink : S.rule}`,
      background: active ? S.ink : S.paper, color: active ? S.paper : S.ink,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms ease', flexShrink: 0,
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = S.ruleMd; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = S.rule; }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: intensity.color, display: 'inline-block' }} />
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em' }}>{region.name}</span>
    </button>
  );
};

export const FeedView: React.FC<FeedViewProps> = ({
  posts, regions, activeRegion, onPostClick, onRegionSelect,
  onVote, onPin, pinnedPosts, loadingPosts,
}) => {
  const [filterType, setFilterType] = useState<FilterType>('all');

  const filtered = useMemo(() =>
    filterType === 'all' ? posts : posts.filter(p => p.type === filterType),
    [posts, filterType]
  );

  const intensity = INTENSITY[activeRegion.intensity] || INTENSITY.STABLE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* HERO */}
      <section style={{ position: 'relative' }}>
        <AmbientGlow size={420} color="rgba(196,138,62,0.28)" style={{ top: -140, right: '15%', zIndex: -1 }} />
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase',
            letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiveDot color={S.primary} size={6} /> &nbsp;Live · {activeRegion.name}
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', fontWeight: 400, color: S.ink,
            letterSpacing: '-0.03em', lineHeight: 0.94, margin: 0 }}>
            {activeRegion.name.charAt(0) + activeRegion.name.slice(1).toLowerCase()}{' '}
            <em style={{ fontStyle: 'italic', color: S.primary }}>feed</em>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p style={{ fontSize: 16, color: S.muted, maxWidth: 560, lineHeight: 1.6, marginTop: 20 }}>
            Verified community reports. Tap vote counts to see contributors.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <button onClick={onPostClick} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              fontFamily: 'inherit', color: '#fff',
              background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
              boxShadow: '0 8px 22px -10px rgba(164,74,58,0.55)',
            }}>
              <Radio size={14} /> Submit Report
            </button>
          </div>
        </Reveal>
      </section>

      {/* FILTERS + REGION PILLS */}
      <Reveal>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, padding: 4, background: S.paper,
            borderRadius: 30, border: `1px solid ${S.rule}` }}>
            {(['all', 'critical', 'info', 'broadcast'] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                style={{
                  padding: '6px 14px', borderRadius: 30, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                  fontFamily: 'inherit', transition: 'all 200ms ease',
                  background: filterType === f ? S.ink : 'transparent',
                  color: filterType === f ? S.paper : S.muted,
                }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: '100%' }} className="no-scrollbar">
            {regions.map((r, idx) => (
              <RegionPill key={r.id} region={r} active={activeRegion.id === r.id} onClick={() => onRegionSelect(idx)} />
            ))}
          </div>
        </div>
      </Reveal>

      {/* CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="cs-grid-lg-2a1">
        <section>
          {loadingPosts ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ padding: 18, borderRadius: 14, background: S.paper, border: `1px solid ${S.rule}` }}>
                  <Skeleton width="40%" height={10} style={{ marginBottom: 12 }} />
                  <Skeleton width="80%" height={18} style={{ marginBottom: 10 }} />
                  <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="92%" height={12} />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((post, i) => {
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
              <Radio size={40} style={{ color: S.ash, opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 12, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                No {filterType !== 'all' ? filterType + ' ' : ''}reports for {activeRegion.name}
              </p>
            </div>
          )}
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Reveal delay={120}>
            <div style={{ padding: 22, position: 'relative', overflow: 'hidden',
              background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase',
                letterSpacing: '0.16em', marginBottom: 18 }}>Region status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                <IntensityRing value={activeRegion.connectivity} size={84} stroke={6}
                  color={intensity.color} label={`${activeRegion.connectivity}%`} sublabel="signal" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24,
                    color: S.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {activeRegion.name.charAt(0) + activeRegion.name.slice(1).toLowerCase()}
                  </p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: intensity.color,
                    textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 6 }}>
                    {activeRegion.intensity}
                  </p>
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: `1px solid ${S.rule}`, margin: '14px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Active hubs', value: String(activeRegion.activeHubs) },
                  { label: 'Emergency',   value: activeRegion.localInfo.emergencyContact, mono: true },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: item.mono ? 11 : 14, fontWeight: 600, color: S.ink,
                      fontFamily: item.mono ? "'JetBrains Mono', monospace" : 'inherit',
                      maxWidth: 160, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <hr style={{ border: 'none', borderTop: `1px solid ${S.rule}`, margin: '14px 0' }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: S.ash, textTransform: 'uppercase',
                  letterSpacing: '0.14em', marginBottom: 10 }}>Safe zones</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeRegion.localInfo.safeZones.slice(0, 3).map((z, i) => (
                    <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: S.secondary,
                      background: 'rgba(61,107,120,0.10)', padding: '4px 10px', borderRadius: 30 }}>
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </aside>
      </div>
    </div>
  );
};
