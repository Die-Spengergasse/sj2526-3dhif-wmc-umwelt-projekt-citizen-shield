import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { regionsRouter } from './routes/regions';
import { postsRouter } from './routes/posts';
import { votesRouter } from './routes/votes';
import { pinsRouter } from './routes/pins';
import { commentsRouter } from './routes/comments';
import { moderationRouter } from './routes/moderation';
import { uploadRouter } from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth',       authRouter);
app.use('/api/regions',    regionsRouter);
// pinsRouter must come before postsRouter so GET /pinned is matched before GET /:id
app.use('/api/posts',      pinsRouter);
app.use('/api/posts',      postsRouter);
app.use('/api/posts',      votesRouter);    // /api/posts/:id/vote
app.use('/api/posts',      commentsRouter); // /api/posts/:id/comments
app.use('/api/moderation', moderationRouter);
app.use('/api/upload',     uploadRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Citizen Shield API listening on port ${PORT}`);
});
