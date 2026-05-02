import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function TeamChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const { uid, displayName, photoURL } = auth.currentUser;
    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid,
      displayName,
      photoURL
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-md">
        <h3 className="font-semibold text-lg">Team Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg) => {
          const isMe = msg.uid === auth.currentUser?.uid;
          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <span className="text-xs text-textSecondary mb-1 px-1">
                {msg.displayName || 'Anonymous'}
              </span>
              <div className={`px-4 py-2 rounded-2xl ${
                isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-slate-700 text-textPrimary rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={auth.currentUser ? "Type a message..." : "Sign in to chat"}
          disabled={!auth.currentUser}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || !auth.currentUser}
          className="bg-primary hover:bg-blue-600 text-white p-2 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center w-10 h-10"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
