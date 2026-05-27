import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { getRealtimeClient, RealtimeEvent } from '../realtime';
import { useAuth } from './AuthContext';

interface RealtimeContextValue {
  subscribe: (topic: string, listener: (e: RealtimeEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useAuth();
  // Module-level singleton: exists synchronously on first render, so child
  // components that subscribe in their own effects always reach a live client.
  const client = getRealtimeClient();

  // Re-issue auth + re-subscribe whenever the signed-in identity changes. We
  // intentionally keep the socket open across sign-in / sign-out.
  useEffect(() => { client.reauth(); }, [firebaseUser?.uid, client]);

  const value = useMemo<RealtimeContextValue>(() => ({
    subscribe: (topic, listener) => client.subscribe(topic, listener),
  }), [client]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}

// Convenience hook: subscribe to a topic and invoke the handler on each event.
// Pass topic=null to skip subscribing (e.g. while a slug is not yet known).
export function useRealtimeTopic(
  topic: string | null | undefined,
  handler: (event: RealtimeEvent) => void,
) {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!topic) return;
    return subscribe(topic, (e) => handlerRef.current(e));
  }, [topic, subscribe]);
}
