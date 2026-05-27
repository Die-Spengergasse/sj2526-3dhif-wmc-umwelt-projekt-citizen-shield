import { auth } from './firebase';
import { Region, Post, PostType, Comment, Notification } from './types';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function apiUpload(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to upload');

  const token = await user.getIdToken();
  const form = new FormData();
  form.append('image', file);

  const res = await fetch('/api/upload/image', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Upload failed');
  }

  const data = await res.json();
  return data.url;
}

// ── Region helpers ──

interface ApiRegion {
  id: string;
  slug: string;
  name: string;
  intensity: 'CRITICAL' | 'HIGH' | 'STABLE' | 'ALERT';
  activeHubs: number;
  connectivity: number;
  description: string;
  imageUrl: string | null;
  mapImageUrl: string | null;
  emergencyContact: string | null;
  centerLat: number | null;
  centerLng: number | null;
  isJoined?: boolean;
}

interface ApiRegionDetail extends ApiRegion {
  safeZones: { id: string; name: string; description: string | null }[];
  resources: { id: string; title: string; category: string; location: string | null }[];
}

function mapApiRegion(r: ApiRegion): Region {
  return {
    id: r.slug,
    slug: r.slug,
    name: r.name,
    intensity: r.intensity,
    activeHubs: r.activeHubs,
    connectivity: r.connectivity,
    description: r.description ?? '',
    image: r.imageUrl ?? '',
    mapImage: r.mapImageUrl ?? '',
    centerLat: r.centerLat ?? null,
    centerLng: r.centerLng ?? null,
    isJoined: r.isJoined ?? false,
    localInfo: {
      emergencyContact: r.emergencyContact ?? '',
      safeZones: [],
      resources: [],
    },
  };
}

function mapApiRegionDetail(r: ApiRegionDetail): Region {
  const region = mapApiRegion(r);
  region.localInfo.safeZones = r.safeZones.map(z => z.name);
  region.localInfo.resources = r.resources.map(r => r.title);
  return region;
}

export async function fetchRegions(): Promise<Region[]> {
  const data: ApiRegion[] = await apiFetch('/api/regions');
  return data.map(mapApiRegion);
}

export async function fetchRegionDetail(slug: string): Promise<Region> {
  const data: ApiRegionDetail = await apiFetch(`/api/regions/${slug}`);
  return mapApiRegionDetail(data);
}

export async function joinRegion(slug: string): Promise<void> {
  await apiFetch(`/api/regions/${slug}/join`, { method: 'POST' });
}

export async function leaveRegion(slug: string): Promise<void> {
  await apiFetch(`/api/regions/${slug}/join`, { method: 'DELETE' });
}

// ── Post helpers ──

interface ApiPost {
  id: string;
  title: string;
  description: string;
  type: PostType;
  imageUrl: string | null;
  images: string[];
  upvoteCount: number;
  downvoteCount: number;
  userVote: 'upvote' | 'downvote' | null;
  status: string;
  location?: { lat: number; lng: number; label?: string | null; status?: string | null } | null;
  locationText?: string;
  region: { slug: string; name: string };
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  tags: string[];
  upvoters: Array<{ id: string; displayName: string; isVerified: boolean }>;
  downvoters: Array<{ id: string; displayName: string; isVerified: boolean }>;
  createdAt: string;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just Now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapApiPost(p: ApiPost): Post {
  return {
    id: p.id,
    regionId: p.region.slug,
    time: formatTime(p.createdAt),
    title: p.title,
    description: p.description,
    type: p.type,
    image: p.images?.[0] ?? p.imageUrl ?? undefined,
    images: p.images?.length ? p.images : (p.imageUrl ? [p.imageUrl] : []),
    tags: p.tags.length > 0 ? p.tags : undefined,
    upvoteCount: p.upvoteCount,
    downvoteCount: p.downvoteCount,
    userVote: p.userVote ?? null,
    upvoters:   p.upvoters   ?? [],
    downvoters: p.downvoters ?? [],
    locationText: p.locationText,
    locationLat: p.location?.lat,
    locationLng: p.location?.lng,
    author: p.author,
    createdAt: p.createdAt,
  };
}

export async function fetchPosts(regionSlug: string): Promise<Post[]> {
  const data: ApiPost[] = await apiFetch(`/api/posts?regionSlug=${encodeURIComponent(regionSlug)}&status=live`);
  return data.map(mapApiPost);
}

export async function fetchPost(postId: string): Promise<Post> {
  const data: ApiPost = await apiFetch(`/api/posts/${postId}`);
  return mapApiPost(data);
}

export async function createPost(params: {
  regionSlug: string;
  title: string;
  description: string;
  type: PostType;
  imageUrls?: string[];
  tags?: string[];
  locationText?: string;
  locationLat?: number;
  locationLng?: number;
}): Promise<{ id: string }> {
  return apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function voteOnPost(postId: string, voteType: 'upvote' | 'downvote' | null): Promise<{
  upvoteCount: number;
  downvoteCount: number;
  userVote: 'upvote' | 'downvote' | null;
}> {
  return apiFetch(`/api/posts/${postId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ voteType }),
  });
}

// ── Comment helpers ──

export async function fetchComments(postId: string): Promise<Comment[]> {
  return apiFetch(`/api/posts/${postId}/comments`);
}

export async function createComment(postId: string, text: string): Promise<Comment> {
  return apiFetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// ── Auth helpers ──

export async function fetchMe() {
  return apiFetch('/api/auth/me');
}

// ── Moderation helpers ──

export interface ApiModerationItem {
  id: string;
  reason: string;
  distanceM: number | null;
  status: string;
  moderatorNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  post: {
    id: string;
    title: string;
    description: string;
    type: PostType;
    imageUrl: string | null;
    images: string[];
    locationText: string | null;
    locationLabel: string | null;
    locationLat: number | null;
    locationLng: number | null;
    createdAt: string;
    author: { displayName: string; avatarUrl: string | null };
    region: { slug: string; name: string };
  };
}

export async function fetchModerationQueue(): Promise<ApiModerationItem[]> {
  return apiFetch('/api/moderation');
}

export async function reviewPost(queueId: string, decision: 'approved' | 'rejected', reason?: string): Promise<void> {
  await apiFetch(`/api/moderation/${queueId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  });
}

// ── Notification helpers ──

interface ApiNotification {
  id: string;
  postId: string | null;
  postTitle: string | null;
  type: 'post_approved' | 'post_rejected';
  reason: string | null;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const data: ApiNotification[] = await apiFetch('/api/notifications');
  return data.map(n => ({
    id: n.id,
    text: n.type === 'post_approved'
      ? `Your report${n.postTitle ? ` "${n.postTitle}"` : ''} was approved${n.reason ? `: ${n.reason}` : ''}`
      : `Your report${n.postTitle ? ` "${n.postTitle}"` : ''} was rejected${n.reason ? `: ${n.reason}` : ''}`,
    time: formatTime(n.createdAt),
    read: n.read,
    _at: new Date(n.createdAt).getTime(),
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/api/notifications/read-all', { method: 'POST' });
}
