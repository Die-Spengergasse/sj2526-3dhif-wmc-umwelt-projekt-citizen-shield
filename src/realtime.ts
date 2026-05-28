import { auth } from './firebase';

// Wire-format event the server sends after auth/subscribe handshake.
export interface RealtimeEvent {
  type: string;
  topic: string;
  payload?: unknown;
}

type Listener = (event: RealtimeEvent) => void;
type StatusListener = (status: 'connecting' | 'open' | 'closed') => void;

interface RealtimeClient {
  subscribe: (topic: string, listener: Listener) => () => void;
  onStatus: (listener: StatusListener) => () => void;
  reauth: () => void;
  close: () => void;
  status: () => 'connecting' | 'open' | 'closed';
}

function wsUrl(): string {
  // In production VITE_API_BASE points to the backend on a different origin
  // (e.g. https://citizen-shield-api.onrender.com). We have to derive the WS
  // URL from it, because the frontend host (Vercel) doesn't run our /ws
  // server. In dev the var is empty and we fall back to the current host so
  // the Vite proxy can route /ws to the local Express server.
  const base = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
  if (base) {
    const wsBase = base.replace(/^http/, 'ws'); // http -> ws, https -> wss
    return `${wsBase}/ws`;
  }
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${window.location.host}/ws`;
}

// Single shared connection. Auto-reconnects with exponential backoff, queues
// outgoing frames while the socket is connecting, and re-subscribes to every
// active topic after a reconnect.
export function createRealtimeClient(): RealtimeClient {
  const topicListeners = new Map<string, Set<Listener>>();
  const statusListeners = new Set<StatusListener>();

  let ws: WebSocket | null = null;
  let status: 'connecting' | 'open' | 'closed' = 'closed';
  let manuallyClosed = false;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let authed = false;
  let outbox: string[] = [];

  function setStatus(next: typeof status) {
    if (status === next) return;
    status = next;
    for (const l of statusListeners) l(next);
  }

  function flushOutbox() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    for (const msg of outbox) ws.send(msg);
    outbox = [];
  }

  function sendOrQueue(obj: unknown) {
    const msg = JSON.stringify(obj);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(msg);
    else outbox.push(msg);
  }

  async function authenticate() {
    const user = auth.currentUser;
    if (!user) { authed = true; return; } // anonymous browse is OK for public topics
    try {
      const token = await user.getIdToken();
      sendOrQueue({ type: 'auth', token });
    } catch {
      // ignore; server will simply not authenticate this connection
    }
  }

  function resubscribeAll() {
    const topics = Array.from(topicListeners.keys());
    if (topics.length) sendOrQueue({ type: 'subscribe', topics });
  }

  function scheduleReconnect() {
    if (manuallyClosed) return;
    if (reconnectTimer) return;
    const delay = Math.min(30_000, 500 * Math.pow(2, reconnectAttempt));
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    setStatus('connecting');
    try {
      ws = new WebSocket(wsUrl());
    } catch {
      ws = null;
      scheduleReconnect();
      return;
    }

    ws.addEventListener('open', () => {
      setStatus('open');
      reconnectAttempt = 0;
      authed = false;
      void authenticate().then(() => {
        resubscribeAll();
        flushOutbox();
      });
    });

    ws.addEventListener('message', (e) => {
      let msg: RealtimeEvent;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === 'auth:ok') { authed = true; return; }
      if (msg.type === 'hello' || msg.type === 'subscribed' || msg.type === 'unsubscribed' || msg.type === 'pong') return;
      const listeners = topicListeners.get(msg.topic);
      if (listeners) {
        for (const l of listeners) {
          try { l(msg); } catch { /* swallow listener errors */ }
        }
      }
    });

    ws.addEventListener('close', () => {
      ws = null;
      setStatus('closed');
      scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // The close handler will fire next and trigger reconnect.
    });
  }

  function subscribe(topic: string, listener: Listener): () => void {
    let set = topicListeners.get(topic);
    const isNewTopic = !set;
    if (!set) { set = new Set(); topicListeners.set(topic, set); }
    set.add(listener);
    if (isNewTopic) sendOrQueue({ type: 'subscribe', topics: [topic] });

    return () => {
      const s = topicListeners.get(topic);
      if (!s) return;
      s.delete(listener);
      if (s.size === 0) {
        topicListeners.delete(topic);
        sendOrQueue({ type: 'unsubscribe', topics: [topic] });
      }
    };
  }

  function onStatus(listener: StatusListener): () => void {
    statusListeners.add(listener);
    listener(status);
    return () => { statusListeners.delete(listener); };
  }

  function close() {
    manuallyClosed = true;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (ws) { try { ws.close(); } catch { /* ignore */ } }
    ws = null;
    setStatus('closed');
  }

  // Re-issue auth on the existing connection (e.g. after sign-in / sign-out)
  // and re-subscribe to every active topic so the server applies the new
  // identity's permissions to all of them.
  function reauth() {
    authed = false;
    void authenticate().then(() => resubscribeAll());
  }

  connect();
  return { subscribe, onStatus, reauth, close, status: () => status };
}

// Single shared client for the whole app. Created lazily on first access so it
// exists before any React effect runs, which is what makes early subscriptions
// (e.g. the feed's posts:<slug> subscription in App.tsx) actually register.
let _client: RealtimeClient | null = null;
export function getRealtimeClient(): RealtimeClient {
  if (!_client) _client = createRealtimeClient();
  return _client;
}
