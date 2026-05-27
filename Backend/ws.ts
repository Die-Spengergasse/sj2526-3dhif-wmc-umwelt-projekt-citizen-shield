import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import admin from 'firebase-admin';
import { pool } from './db';

// Topic format examples:
//   posts:<regionSlug>   – feed-level events for a region
//   post:<postId>        – detail-level events for one post
//   user:<dbUserId>      – notifications & per-user state (auto-subscribed)
//   moderation          – admin-only moderation-queue events
export type Topic = string;

export interface WsEvent {
  type: string;
  topic: Topic;
  payload?: unknown;
}

interface Client {
  ws: WebSocket;
  dbUserId: string | null;
  firebaseUid: string | null;
  isAdmin: boolean;
  topics: Set<Topic>;
  alive: boolean;
}

const clients = new Set<Client>();
const topicIndex = new Map<Topic, Set<Client>>();

function addToTopic(client: Client, topic: Topic) {
  if (client.topics.has(topic)) return;
  client.topics.add(topic);
  let set = topicIndex.get(topic);
  if (!set) { set = new Set(); topicIndex.set(topic, set); }
  set.add(client);
}

function removeFromTopic(client: Client, topic: Topic) {
  if (!client.topics.delete(topic)) return;
  const set = topicIndex.get(topic);
  if (!set) return;
  set.delete(client);
  if (set.size === 0) topicIndex.delete(topic);
}

function cleanup(client: Client) {
  for (const t of client.topics) {
    const set = topicIndex.get(t);
    if (set) {
      set.delete(client);
      if (set.size === 0) topicIndex.delete(t);
    }
  }
  client.topics.clear();
  clients.delete(client);
}

async function lookupDbUser(firebaseUid: string): Promise<{ id: string; isAdmin: boolean } | null> {
  try {
    const r = await pool.query('SELECT id, is_admin FROM users WHERE google_uid = $1', [firebaseUid]);
    if (!r.rows[0]) return null;
    return { id: r.rows[0].id, isAdmin: !!r.rows[0].is_admin };
  } catch {
    return null;
  }
}

function canSubscribe(client: Client, topic: Topic): boolean {
  if (topic.startsWith('posts:') || topic.startsWith('post:')) return true;
  if (topic === 'moderation') return client.isAdmin;
  if (topic.startsWith('user:')) {
    const uid = topic.slice('user:'.length);
    return client.dbUserId !== null && client.dbUserId === uid;
  }
  return false;
}

function send(ws: WebSocket, msg: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

async function handleMessage(client: Client, raw: RawData) {
  let msg: { type?: string; token?: string; topic?: string; topics?: string[] };
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (msg.type === 'auth' && typeof msg.token === 'string') {
    try {
      const decoded = await admin.auth().verifyIdToken(msg.token);
      const dbUser = await lookupDbUser(decoded.uid);
      client.firebaseUid = decoded.uid;
      client.dbUserId = dbUser?.id ?? null;
      client.isAdmin = dbUser?.isAdmin ?? false;
      if (client.dbUserId) addToTopic(client, `user:${client.dbUserId}`);
      send(client.ws, { type: 'auth:ok', userId: client.dbUserId, isAdmin: client.isAdmin });
    } catch {
      send(client.ws, { type: 'auth:error' });
    }
    return;
  }

  if (msg.type === 'subscribe') {
    const topics = msg.topics ?? (msg.topic ? [msg.topic] : []);
    const accepted: string[] = [];
    const denied: string[] = [];
    for (const t of topics) {
      if (canSubscribe(client, t)) {
        addToTopic(client, t);
        accepted.push(t);
      } else {
        denied.push(t);
      }
    }
    send(client.ws, { type: 'subscribed', accepted, denied });
    return;
  }

  if (msg.type === 'unsubscribe') {
    const topics = msg.topics ?? (msg.topic ? [msg.topic] : []);
    for (const t of topics) removeFromTopic(client, t);
    send(client.ws, { type: 'unsubscribed', topics });
    return;
  }

  if (msg.type === 'ping') {
    send(client.ws, { type: 'pong' });
    return;
  }
}

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    const client: Client = {
      ws,
      dbUserId: null,
      firebaseUid: null,
      isAdmin: false,
      topics: new Set(),
      alive: true,
    };
    clients.add(client);

    ws.on('pong', () => { client.alive = true; });
    ws.on('message', (raw) => { void handleMessage(client, raw); });
    ws.on('close', () => cleanup(client));
    ws.on('error', () => cleanup(client));

    send(ws, { type: 'hello' });
  });

  // Heartbeat: drop dead connections.
  const interval = setInterval(() => {
    for (const client of clients) {
      if (!client.alive) {
        client.ws.terminate();
        cleanup(client);
        continue;
      }
      client.alive = false;
      try { client.ws.ping(); } catch { /* ignore */ }
    }
  }, 30_000);

  wss.on('close', () => clearInterval(interval));

  console.log('WebSocket server listening on /ws');
}

// Broadcast an event to every client subscribed to the given topic.
export function broadcast(topic: Topic, type: string, payload?: unknown) {
  const set = topicIndex.get(topic);
  if (!set || set.size === 0) return;
  const msg = JSON.stringify({ type, topic, payload });
  for (const client of set) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}

// Broadcast to multiple topics in one call (deduplicates clients on overlap).
export function broadcastMany(topics: Topic[], type: string, payload?: unknown) {
  const seen = new Set<Client>();
  const msg = JSON.stringify({ type, topic: topics[0] ?? '', payload });
  for (const t of topics) {
    const set = topicIndex.get(t);
    if (!set) continue;
    for (const client of set) {
      if (seen.has(client)) continue;
      seen.add(client);
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    }
  }
}
