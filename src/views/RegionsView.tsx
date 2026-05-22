import React, { useState, useCallback, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Radio, Users, Heart,
  ShieldCheck, MapPin, ShieldAlert, X, Send, LogOut } from 'lucide-react';
import { S, INTENSITY, REGION_COORDS } from '../design-tokens';
import { Reveal, AmbientGlow, CountUp, IntensityRing, showToast } from '../motion';
import { RegionSelector } from '../components/RegionSelector';
import { ActionButton } from '../components/ActionButton';
import { TimelineItem } from '../components/TimelineItem';
import { Region, Post, AppUser } from '../types';
import { createPost } from '../api';

// ── Emergency Aid Modal ─────────────────────────────────────

const EmergencyAidModal: React.FC<{
  region: Region;
  user: AppUser | null;
  onSignIn: () => void;
  onClose: () => void;
}> = ({ region, user, onSignIn, onClose }) => {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (!user) { onClose(); onSignIn(); return; }
    setSubmitting(true);
    try {
      await createPost({
        regionSlug: region.slug,
        title: `Emergency Aid Request — ${region.name}`,
        description: description.trim(),
        type: 'critical',
        tags: ['emergency-aid'],
      });
      showToast({ text: 'Emergency aid request submitted.', tone: 'primary' });
      onClose();
    } catch {
      showToast({ text: 'Submission failed. Please try again.', tone: 'ink' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, borderRadius: 20, background: S.paper,
        border: `1px solid ${S.rule}`, boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.rule}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: S.ink }}>Request Emergency Aid</h3>
            <p style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>
              Region: <span style={{ color: S.primary, fontWeight: 600 }}>{region.name}</span>
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 9, border: `1px solid ${S.rule}`,
            background: 'transparent', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: S.muted,
          }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase',
              letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Situation Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the emergency and what kind of aid is needed…"
              maxLength={1000} rows={4}
              style={{ width: '100%', background: S.paperHi, border: `1px solid ${S.rule}`,
                borderRadius: 10, padding: '10px 14px', fontSize: 13, color: S.ink,
                outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = S.primary)}
              onBlur={e => (e.target.style.borderColor = S.rule)} />
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 10,
            background: 'rgba(164,74,58,0.08)', border: '1px solid rgba(164,74,58,0.2)' }}>
            <p style={{ fontSize: 12, color: S.primary, lineHeight: 1.5 }}>
              This will be posted as a <strong>Critical</strong> alert tagged <strong>#emergency-aid</strong> and visible to all community members.
            </p>
          </div>
          <button type="submit" disabled={submitting || !description.trim()} style={{
            width: '100%', padding: 13, borderRadius: 12, border: 'none',
            cursor: submitting || !description.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 14, color: '#fff', background: S.primary,
            opacity: submitting || !description.trim() ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit',
          }}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Request Aid</>}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Volunteer Modal ─────────────────────────────────────────

const VolunteerModal: React.FC<{
  region: Region;
  user: AppUser | null;
  onSignIn: () => void;
  onClose: () => void;
}> = ({ region, user, onSignIn, onClose }) => {
  const [name, setName]       = useState(user?.displayName || '');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    if (!user) { onClose(); onSignIn(); return; }
    setSubmitting(true);
    try {
      await createPost({
        regionSlug: region.slug,
        title: `Volunteer Offer — ${region.name}`,
        description: `Name: ${name.trim()}\nContact: ${contact.trim()}`,
        type: 'broadcast',
        tags: ['volunteer'],
      });
      showToast({ text: 'Volunteer offer submitted to the hub.', tone: 'primary' });
      onClose();
    } catch {
      showToast({ text: 'Submission failed. Please try again.', tone: 'ink' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, borderRadius: 20, background: S.paper,
        border: `1px solid ${S.rule}`, boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.rule}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: S.ink }}>Volunteer for Local Hub</h3>
            <p style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>
              Region: <span style={{ color: S.secondary, fontWeight: 600 }}>{region.name}</span>
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 9, border: `1px solid ${S.rule}`,
            background: 'transparent', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: S.muted,
          }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Your Name *', value: name, onChange: setName, placeholder: 'Full name or alias' },
            { label: 'Contact Info *', value: contact, onChange: setContact, placeholder: 'Signal / Telegram / Email…' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase',
                letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type="text" value={f.value} onChange={e => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', background: S.paperHi, border: `1px solid ${S.rule}`,
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: S.ink,
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = S.secondary)}
                onBlur={e => (e.target.style.borderColor = S.rule)} />
            </div>
          ))}
          <div style={{ padding: '10px 14px', borderRadius: 10,
            background: 'rgba(61,107,120,0.08)', border: '1px solid rgba(61,107,120,0.2)' }}>
            <p style={{ fontSize: 12, color: S.secondary, lineHeight: 1.5 }}>
              Your offer will be posted as a <strong>Broadcast</strong> tagged <strong>#volunteer</strong> and shared with hub coordinators.
            </p>
          </div>
          <button type="submit" disabled={submitting || !name.trim() || !contact.trim()} style={{
            width: '100%', padding: 13, borderRadius: 12, border: 'none',
            cursor: submitting || !name.trim() || !contact.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 14, color: '#fff',
            background: `linear-gradient(135deg, ${S.secondary} 0%, ${S.secondary}cc 100%)`,
            opacity: submitting || !name.trim() || !contact.trim() ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit',
          }}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Volunteer</>}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Posts Map ────────────────────────────────────────────────

interface PostsMapProps {
  region: Region;
  posts: Post[];
  onPostClick: (postId: string) => void;
}

const PostsMap: React.FC<PostsMapProps> = ({ region, posts, onPostClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const coords = REGION_COORDS[region.slug] || { lat: 20, lng: 40, zoom: 4 };
  const centerLat = (region.centerLat != null ? region.centerLat : coords.lat) as number;
  const centerLng = (region.centerLng != null ? region.centerLng : coords.lng) as number;

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    }).setView([centerLat, centerLng], coords.zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    // Region center
    const centerIcon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:28px;height:28px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(164,74,58,0.25);animation:warm-pulse 1.8s ease-in-out infinite;"></div>
        <div style="position:absolute;inset:6px;border-radius:50%;background:#a44a3a;border:3px solid #fbf7ec;box-shadow:0 4px 12px rgba(164,74,58,0.4);"></div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([centerLat, centerLng], { icon: centerIcon }).addTo(map);

    // Post markers
    for (const post of posts) {
      if (post.locationLat == null || post.locationLng == null) continue;
      const postIcon = L.divIcon({
        className: '',
        html: `<div style="width:13px;height:13px;border-radius:50%;background:#3d6b78;border:2.5px solid #fbf7ec;box-shadow:0 2px 8px rgba(61,107,120,0.45);cursor:pointer;transition:transform 150ms;"></div>`,
        iconSize: [13, 13],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([post.locationLat, post.locationLng], { icon: postIcon });
      marker.on('click', () => onPostClick(post.id));
      if (post.title) {
        marker.bindTooltip(post.title, { direction: 'top', offset: [0, -8], className: '' });
      }
      marker.addTo(map);
    }

    mapRef.current = map;
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [region.slug, centerLat, centerLng, coords.zoom, posts, onPostClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{
        width: '100%', height: '100%',
        filter: 'sepia(0.08) saturate(0.88) contrast(0.96)',
      }} />
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 999,
        background: 'rgba(251,247,236,0.92)', backdropFilter: 'blur(8px)',
        padding: '8px 12px', borderRadius: 10, border: `1px solid ${S.rule}`,
        display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: S.primary, border: `2px solid ${S.paper}`, display: 'inline-block' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Crisis Hub</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.secondary, border: `1.5px solid ${S.paper}`, display: 'inline-block' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Report</span>
        </div>
      </div>
      {/* Region label */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 999,
        background: 'rgba(251,247,236,0.92)', backdropFilter: 'blur(8px)',
        padding: '5px 11px', borderRadius: 30, border: `1px solid ${S.rule}`, pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          {region.name}
        </span>
      </div>
    </div>
  );
};

// ── Main RegionsView ────────────────────────────────────────

interface RegionsViewProps {
  regions: Region[];
  posts: Post[];
  user: AppUser | null;
  activeRegionIdx: number;
  onRegionIdxChange: (idx: number) => void;
  onSignIn: () => void;
  onOpenPostForm: (user: AppUser | null, signIn: () => void) => void;
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void;
  onJoinRegion: (slug: string, user: AppUser | null, signIn: () => void) => void;
  onLeaveRegion: (slug: string) => void;
  joiningRegion: string | null;
  joinedRegions: string[];
  onViewChange?: (view: string) => void;
}

export const RegionsView: React.FC<RegionsViewProps> = ({
  regions, posts, user, activeRegionIdx, onRegionIdxChange,
  onSignIn, onOpenPostForm,
  onVote, onJoinRegion, onLeaveRegion, joiningRegion, joinedRegions, onViewChange,
}) => {
  const [showSelector,    setShowSelector]    = useState(false);
  const [loadingPosts,    setLoadingPosts]    = useState(false);
  const [emergencyOpen,   setEmergencyOpen]   = useState(false);
  const [volunteerOpen,   setVolunteerOpen]   = useState(false);
  const [highlightedPost, setHighlightedPost] = useState<string | null>(null);
  const [wide, setWide] = useState(() => window.innerWidth >= 900);

  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const prevIdx = useRef(activeRegionIdx);

  const region = regions[activeRegionIdx] || regions[0];
  const regionPosts = posts.filter(p => p.regionId === region?.slug);
  const isJoined = joinedRegions.includes(region?.slug);
  const intensity = region ? (INTENSITY[region.intensity] || INTENSITY.STABLE) : INTENSITY.STABLE;

  useEffect(() => {
    const fn = () => setWide(window.innerWidth >= 900);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const go = useCallback((delta: number) => {
    onRegionIdxChange((activeRegionIdx + delta + regions.length) % regions.length);
  }, [activeRegionIdx, regions.length, onRegionIdxChange]);

  useEffect(() => {
    if (prevIdx.current === activeRegionIdx) return;
    prevIdx.current = activeRegionIdx;
    setLoadingPosts(true);
    setHighlightedPost(null);
    const t = setTimeout(() => setLoadingPosts(false), 500);
    return () => clearTimeout(t);
  }, [activeRegionIdx]);

  const handleMapMarkerClick = useCallback((postId: string) => {
    setHighlightedPost(postId);
    const el = postRefs.current[postId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  if (!region) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {showSelector && (
        <RegionSelector regions={regions} activeRegionId={region.id}
          onSelect={i => { onRegionIdxChange(i); setShowSelector(false); }}
          onClose={() => setShowSelector(false)} />
      )}
      {emergencyOpen && (
        <EmergencyAidModal region={region} user={user} onSignIn={onSignIn} onClose={() => setEmergencyOpen(false)} />
      )}
      {volunteerOpen && (
        <VolunteerModal region={region} user={user} onSignIn={onSignIn} onClose={() => setVolunteerOpen(false)} />
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          {regions.map((r, i) => (
            <button key={r.id} onClick={() => onRegionIdxChange(i)} style={{
              border: 'none', cursor: 'pointer', padding: 0, borderRadius: 4,
              width: i === activeRegionIdx ? 30 : 8, height: 6,
              background: i === activeRegionIdx ? S.ink : 'rgba(31,26,19,0.20)',
              transition: 'width 320ms cubic-bezier(.2,.7,.2,1), background 320ms ease',
            }} />
          ))}
        </div>

        <p style={{ fontSize: 16, color: S.muted, maxWidth: 560, lineHeight: 1.6, marginBottom: 24 }}>
          {region.description}
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isJoined ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                borderRadius: 30, border: `1px solid ${S.tertiary}80`,
                fontWeight: 600, fontSize: 13, color: S.tertiary,
              }}>
                <CheckCircle2 size={14} /> Joined
              </span>
              <button onClick={() => onLeaveRegion(region.slug)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                borderRadius: 30, border: `1px solid ${S.rule}`, cursor: 'pointer',
                fontWeight: 600, fontSize: 12, fontFamily: 'inherit', background: 'transparent', color: S.muted,
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = S.primary; b.style.borderColor = S.primary + '60'; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = S.muted; b.style.borderColor = S.rule; }}>
                <LogOut size={13} /> Leave
              </button>
            </div>
          ) : (
            <button
              onClick={() => joiningRegion === region.slug ? null : onJoinRegion(region.slug, user, onSignIn)}
              disabled={joiningRegion === region.slug}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                borderRadius: 30, border: 'none',
                cursor: joiningRegion === region.slug ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: 13, fontFamily: 'inherit', color: '#fff',
                background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
                opacity: joiningRegion === region.slug ? 0.6 : 1,
                boxShadow: '0 8px 22px -10px rgba(164,74,58,0.55)',
              }}>
              {joiningRegion === region.slug
                ? <><Loader2 size={14} className="animate-spin" /> Joining…</>
                : <>Offer Support</>}
            </button>
          )}
          <button onClick={() => onViewChange?.('safety')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            borderRadius: 30, border: `1px solid ${S.ruleMd}`, cursor: 'pointer',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: S.ink,
          }}>
            Safety Guide
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
              {region.localInfo.emergencyContact || 'Contact local hub'}
            </p> },
          { title: 'Safe zones', icon: <MapPin size={14} />, color: S.secondary,
            content: region.localInfo.safeZones.length > 0 ? (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
                {region.localInfo.safeZones.map((z, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.secondary,
                      marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: S.ink, fontWeight: 500 }}>{z}</span>
                  </li>
                ))}
              </ul>
            ) : <p style={{ fontSize: 12, color: S.ash }}>None listed yet</p> },
          { title: 'Resources', icon: <Heart size={14} />, color: S.tertiary,
            content: region.localInfo.resources.length > 0 ? (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
                {region.localInfo.resources.map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.tertiary,
                      marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: S.ink, fontWeight: 500 }}>{r}</span>
                  </li>
                ))}
              </ul>
            ) : <p style={{ fontSize: 12, color: S.ash }}>None listed yet</p> },
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

      {/* MAP + POSTS */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: wide ? '55fr 45fr' : '1fr',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Left: sticky map */}
        <div style={{
          position: wide ? 'sticky' : 'relative',
          top: wide ? 80 : 0,
          height: wide ? 'calc(100vh - 80px)' : 250,
          borderRadius: 16,
          overflow: 'hidden',
          background: S.paper,
          border: `1px solid ${S.rule}`,
        }}>
          <PostsMap
            key={region.slug}
            region={region}
            posts={regionPosts}
            onPostClick={handleMapMarkerClick}
          />
        </div>

        {/* Right: scrollable posts + tools */}
        <div ref={rightPanelRef} style={{
          height: wide ? 'calc(100vh - 80px)' : 'auto',
          overflowY: wide ? 'auto' : 'visible',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingRight: wide ? 4 : 0,
        }}>
          {/* Community tools */}
          <Reveal delay={60}>
            <div style={{ padding: '16px 18px', background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: S.ash, textTransform: 'uppercase',
                letterSpacing: '0.16em', marginBottom: 12 }}>Community tools</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ActionButton label="Emergency aid" icon={<Heart size={14} />} color="text-primary"
                  onClick={() => { if (!user) { onSignIn(); return; } setEmergencyOpen(true); }} />
                <ActionButton label="Share update" icon={<Radio size={14} />}
                  color="text-tertiary" onClick={() => onOpenPostForm(user, onSignIn)} />
                <ActionButton label="Volunteer" icon={<Users size={14} />} color="text-secondary"
                  onClick={() => { if (!user) { onSignIn(); return; } setVolunteerOpen(true); }} />
              </div>
            </div>
          </Reveal>

          {/* Posts header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              Community reports
            </p>
            <span style={{ fontSize: 11, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {regionPosts.length} signals
            </span>
          </div>

          {/* Posts list */}
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
            regionPosts.map((post, i) => (
              <div key={post.id} ref={el => { postRefs.current[post.id] = el; }}>
                <Reveal delay={i * 60}>
                  <TimelineItem
                    post={post}
                    onVote={onVote}
                    highlighted={highlightedPost === post.id}
                  />
                </Reveal>
              </div>
            ))
          ) : (
            <div style={{ padding: 48, textAlign: 'center', background: S.paper,
              border: `1px solid ${S.rule}`, borderRadius: 16 }}>
              <Radio size={36} style={{ color: S.ash, opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 12, color: S.ash, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                No reports yet
              </p>
            </div>
          )}

          {/* Safety tips */}
          <Reveal delay={180}>
            <div style={{ padding: 20, background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16 }}>
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
        </div>
      </section>
    </div>
  );
};
