import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, AuthRequest } from '../middleware/auth';

export const notificationsRouter = Router();

// GET /api/notifications  — unread + last 50 for the logged-in user
notificationsRouter.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;

    const result = await pool.query(
      `SELECT n.id, n.post_id, n.type, n.reason, n.read, n.created_at,
              p.title AS post_title
       FROM notifications n
       LEFT JOIN posts p ON p.id = n.post_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    return res.json(result.rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      postTitle: row.post_title,
      type: row.type,
      reason: row.reason,
      read: row.read,
      createdAt: row.created_at,
    })));
  } catch (err) {
    console.error('GET /notifications error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/notifications/read-all  — must be before /:id/read
notificationsRouter.post('/read-all', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;

    await pool.query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
      [userId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /notifications/read-all error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/notifications/:id/read
notificationsRouter.post('/:id/read', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;

    await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('POST /notifications/:id/read error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});
