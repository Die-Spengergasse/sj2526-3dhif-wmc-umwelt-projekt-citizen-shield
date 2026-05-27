import { broadcast, broadcastMany } from './ws';

// Centralised, typed event emitters. Route handlers call these after a
// successful DB write; the WS layer fans them out to subscribed clients.

export function emitPostCreated(regionSlug: string, postId: string) {
  broadcast(`posts:${regionSlug}`, 'post:created', { postId, regionSlug });
}

export function emitPostUpdated(regionSlug: string, postId: string) {
  broadcastMany([`posts:${regionSlug}`, `post:${postId}`], 'post:updated', { postId, regionSlug });
}

export function emitPostDeleted(regionSlug: string, postId: string) {
  broadcastMany([`posts:${regionSlug}`, `post:${postId}`], 'post:deleted', { postId, regionSlug });
}

export function emitVoteChanged(regionSlug: string, postId: string) {
  broadcastMany([`posts:${regionSlug}`, `post:${postId}`], 'vote:changed', { postId, regionSlug });
}

export function emitCommentCreated(postId: string) {
  broadcast(`post:${postId}`, 'comment:created', { postId });
}

export function emitModerationChanged(postId?: string) {
  broadcast('moderation', 'moderation:changed', { postId });
}

export function emitNotification(dbUserId: string) {
  broadcast(`user:${dbUserId}`, 'notification:created', { userId: dbUserId });
}

export function emitMembershipChanged(dbUserId: string, regionSlug: string, joined: boolean) {
  broadcast(`user:${dbUserId}`, 'region:membership_changed', { regionSlug, joined });
}
