import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, AuthRequest } from '../middleware/auth';

export const moderationRouter = Router();

// GET /api/moderation  – pending queue (all logged-in users for now)
moderationRouter.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      `SELECT mq.id, mq.reason, mq.distance_m, mq.status, mq.moderator_note,
              mq.created_at, mq.reviewed_at,
              p.id           AS post_id,
              p.title, p.description, p.type, p.image_url,
              p.created_at   AS post_created_at,
              u.display_name AS author_name,
              u.avatar_url   AS author_avatar,
              r.slug         AS region_slug,
              r.name         AS region_name
       FROM moderation_queue mq
       JOIN posts   p ON p.id   = mq.post_id
       JOIN users   u ON u.id   = p.author_id
       JOIN regions r ON r.id   = p.region_id
       WHERE mq.status = 'pending'
       ORDER BY mq.created_at ASC
       LIMIT 50`
    );

    return res.json(result.rows.map(row => ({
      id: row.id,
      reason: row.reason,
      distanceM: row.distance_m,
      status: row.status,
      moderatorNote: row.moderator_note,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      post: {
        id: row.post_id,
        title: row.title,
        description: row.description,
        type: row.type,
        imageUrl: row.image_url,
        createdAt: row.post_created_at,
        author: { displayName: row.author_name, avatarUrl: row.author_avatar },
        region: { slug: row.region_slug, name: row.region_name },
      },
    })));
  } catch (err) {
    console.error('GET /moderation error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/moderation/:id/review  – approve or reject
moderationRouter.post('/:id/review', verifyToken, async (req: AuthRequest, res) => {
  const { decision, reason } = req.body as { decision: 'approved' | 'rejected'; reason?: string };

  if (decision !== 'approved' && decision !== 'rejected') {
    return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = userRes.rows[0].id;

    const queueRes = await client.query(
      `SELECT mq.id, mq.post_id, p.author_id
       FROM moderation_queue mq
       JOIN posts p ON p.id = mq.post_id
       WHERE mq.id = $1 AND mq.status = 'pending'`,
      [req.params.id]
    );
    if (!queueRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Queue entry not found or already reviewed' });
    }
    const { post_id: postId, author_id: authorId } = queueRes.rows[0];
    const newPostStatus = decision === 'approved' ? 'live' : 'rejected';

    await client.query(
      `UPDATE moderation_queue
       SET status = $1, moderator_id = $2, moderator_note = $3, reviewed_at = now()
       WHERE id = $4`,
      [decision, userId, reason ?? null, req.params.id]
    );

    await client.query(
      'UPDATE posts SET post_status = $1, moderation_note = $2 WHERE id = $3',
      [newPostStatus, reason ?? null, postId]
    );

    // Notify the post author
    if (authorId) {
      const notifType = decision === 'approved' ? 'post_approved' : 'post_rejected';
      await client.query(
        `INSERT INTO notifications (user_id, post_id, type, reason)
         VALUES ($1, $2, $3, $4)`,
        [authorId, postId, notifType, reason ?? null]
      );
    }

    await client.query('COMMIT');
    return res.json({ decision, postId, newPostStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /moderation/:id/review error', err);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});
