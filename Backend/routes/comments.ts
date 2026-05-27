import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, optionalToken, AuthRequest } from '../middleware/auth';
import { emitCommentCreated } from '../events';

export const commentsRouter = Router();

// GET /api/posts/:id/comments
commentsRouter.get('/:id/comments', optionalToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.text, c.created_at,
              u.id AS user_id, u.display_name, u.is_verified
       FROM post_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    return res.json(result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.display_name,
      text: r.text,
      time: new Date(r.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      isVerified: r.is_verified,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /posts/:id/comments error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/posts/:id/comments
commentsRouter.post('/:id/comments', verifyToken, async (req: AuthRequest, res) => {
  const { text } = req.body as { text: string };
  if (!text?.trim() || text.trim().length > 1000) {
    return res.status(400).json({ error: 'text must be 1–1000 characters' });
  }

  try {
    const userRes = await pool.query(
      'SELECT id, display_name, is_verified FROM users WHERE google_uid = $1',
      [req.firebaseUid]
    );
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];

    const postRes = await pool.query('SELECT id FROM posts WHERE id = $1', [req.params.id]);
    if (!postRes.rows[0]) return res.status(404).json({ error: 'Post not found' });

    const result = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [req.params.id, user.id, text.trim()]
    );

    const row = result.rows[0];
    emitCommentCreated(req.params.id);
    return res.status(201).json({
      id: row.id,
      userId: user.id,
      name: user.display_name,
      text: text.trim(),
      time: new Date(row.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      isVerified: user.is_verified,
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error('POST /posts/:id/comments error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});
