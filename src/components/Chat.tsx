import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Loader2, LogIn } from 'lucide-react';
import { S } from '../design-tokens';
import { AppUser } from '../types';

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  time: string;
  isMine?: boolean;
}

interface ChatProps {
  region: string;
  messages?: ChatMessage[];
  currentUser: AppUser | null;
  onClose: () => void;
  onSignIn?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ region, messages: initialMessages = [], currentUser, onClose, onSignIn }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput]    = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    const t = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'auto-' + Date.now(), userId: 'auto', displayName: 'Hub Monitor',
        text: 'Status update: primary corridors are clear. Stay alert and check in regularly.',
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !currentUser) return;
    setSending(true);
    setMessages(prev => [...prev, {
      id: 'u-' + Date.now(), userId: currentUser.uid, displayName: currentUser.displayName,
      text, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), isMine: true,
    }]);
    setInput('');
    setSending(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 20, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'all', width: 340, height: 520, borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        background: S.surf1, border: `1px solid ${S.borderMd}`, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>

        <div style={{ padding: '14px 16px', background: S.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }}/>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '-0.01em' }}>{region?.toUpperCase()} · Live Chat</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>End-to-end encrypted</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={15}/>
          </button>
        </div>

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: 8, flexDirection: msg.isMine ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!msg.isMine && (
                <div style={{ width: 26, height: 26, borderRadius: 7, background: S.surf3, color: S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {msg.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: msg.isMine ? 'flex-end' : 'flex-start' }}>
                {!msg.isMine && <span style={{ fontSize: 9, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>{msg.displayName}</span>}
                <div style={{ padding: '9px 13px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
                  borderBottomRightRadius: msg.isMine ? 4 : 14, borderBottomLeftRadius: msg.isMine ? 14 : 4,
                  background: msg.isMine ? S.primary : S.surf3, color: msg.isMine ? '#fff' : S.text }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: 9, color: S.muted, fontWeight: 500 }}>{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        <div style={{ padding: '10px 12px', borderTop: `1px solid ${S.border}`, flexShrink: 0 }}>
          {currentUser ? (
            <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder="Send a message…"
                style={{ flex: 1, background: S.surf2, border: `1px solid ${S.border}`, borderRadius: 10, padding: '9px 14px',
                  fontSize: 13, color: S.text, outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = S.primary}
                onBlur={e => e.target.style.borderColor = S.border}/>
              <button type="submit" disabled={!input.trim() || sending}
                style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: S.primary, color: '#fff',
                  cursor: !input.trim() || sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, opacity: !input.trim() || sending ? 0.4 : 1, transition: 'opacity 0.15s' }}>
                {sending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
              </button>
            </form>
          ) : (
            <button onClick={onSignIn} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', border: `1px solid ${S.rule}`, borderRadius: 10,
              background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: S.muted, fontFamily: 'inherit',
            }}>
              <LogIn size={13}/> Sign in to send messages
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
