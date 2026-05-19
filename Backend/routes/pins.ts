import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, optionalToken, AuthRequest } from '../middleware/auth';

export const pinsRouter = Router();

// GET /api/posts/pinned  – must be registered BEFORE /:id route
// Pins are community-wide: any user pin makes the post pinned for everyone.
pinsRouter.get('/pinned', optionalToken, async (_req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT pp.post_id, pp.region_slug, MAX(pp.created_at) AS pinned_at
       FROM pinned_posts pp
       GROUP BY pp.post_id, pp.region_slug
       ORDER BY pinned_at DESC`
    );

    // Group by region_slug: { [slug]: string[] }
    const grouped: Record<string, string[]> = {};
    for (const row of result.rows) {
      if (!grouped[row.region_slug]) grouped[row.region_slug] = [];
      grouped[row.region_slug].push(row.post_id);
    }

    return res.json(grouped);
  } catch (err) {
    console.error('GET /posts/pinned error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/posts/:id/pin
pinsRouter.post('/:id/pin', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;

    const postRes = await pool.query(
      'SELECT p.id, r.slug FROM posts p JOIN regions r ON r.id = p.region_id WHERE p.id = $1',
      [req.params.id]
    );
    if (!postRes.rows[0]) return res.status(404).json({ error: 'Post not found' });
    const { slug: regionSlug } = postRes.rows[0];

    await pool.query(
      `INSERT INTO pinned_posts (user_id, post_id, region_slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, post_id) DO NOTHING`,
      [userId, req.params.id, regionSlug]
    );

    return res.json({ pinned: true });
  } catch (err) {
    console.error('POST /posts/:id/pin error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/posts/:id/pin
// Community-wide unpin: removes all pin rows for the post so it disappears for everyone.
pinsRouter.delete('/:id/pin', verifyToken, async (req: AuthRequest, res) => {
  try {
    await pool.query(
      'DELETE FROM pinned_posts WHERE post_id = $1',
      [req.params.id]
    );

    return res.json({ pinned: false });
  } catch (err) {
    console.error('DELETE /posts/:id/pin error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});
