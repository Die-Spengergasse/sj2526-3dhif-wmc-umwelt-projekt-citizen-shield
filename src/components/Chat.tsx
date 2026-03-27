import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, LogIn, X, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  timestamp: Timestamp;
  region: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ChatProps {
  region: string;
  onClose: () => void;
}

export const Chat = ({ region, onClose }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const path = `chats/${region}/messages`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user, region]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const path = `chats/${region}/messages`;
    try {
      await addDoc(collection(db, path), {
        text: newMessage,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        timestamp: serverTimestamp(),
        region: region
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  if (loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-lg h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-black/5">
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-headline font-black text-xl uppercase tracking-tighter">{region} Hub Chat</h3>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Real-time Coordination</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-background"
        >
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 bg-primary/5 rounded-full">
                <LogIn size={48} className="text-primary/40" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">Join the Conversation</h4>
                <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
                  Sign in with Google to coordinate aid and share urgent updates with your local community.
                </p>
              </div>
              <button 
                onClick={handleLogin}
                className="px-8 py-3 bg-primary text-white font-black rounded-xl uppercase tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <LogIn size={18} />
                Sign In with Google
              </button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/40 italic text-sm">
                  No messages yet. Be the first to start the coordination.
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.authorId === user.uid ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.authorId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${msg.authorId === user.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 border border-black/5">
                        {msg.authorPhoto ? (
                          <img src={msg.authorPhoto} alt={msg.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                            <UserIcon size={14} />
                          </div>
                        )}
                      </div>
                      <div className={`flex flex-col ${msg.authorId === user.uid ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-bold text-on-surface-variant mb-1 px-1">
                          {msg.authorName}
                        </span>
                        <div className={`p-3 rounded-2xl text-sm ${
                          msg.authorId === user.uid 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-surface-container-highest text-on-surface rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        {user && (
          <form 
            onSubmit={handleSendMessage}
            className="p-6 border-t border-black/5 bg-surface-container-low"
          >
            <div className="flex gap-3">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type urgent update..."
                className="flex-1 bg-background border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="p-3 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-md shadow-primary/20"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
};
