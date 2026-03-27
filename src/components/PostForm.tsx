import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, AlertTriangle, Info, Radio, Image as ImageIcon } from 'lucide-react';
import { PostType } from '../types';

interface PostFormProps {
  onClose: () => void;
  onSubmit: (post: { title: string; description: string; type: PostType; image?: string }) => void;
}

export const PostForm = ({ onClose, onSubmit }: PostFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PostType>('info');
  const [image, setImage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    onSubmit({ title, description, type, image: image || undefined });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-surface-container-low w-full max-w-lg rounded-3xl border border-black/5 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-surface-container-high">
          <h3 className="text-xl font-headline font-black uppercase tracking-tighter text-primary">Submit Community Report</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Report Type</label>
            <div className="grid grid-cols-3 gap-2">
              <TypeButton 
                active={type === 'critical'} 
                onClick={() => setType('critical')} 
                icon={<AlertTriangle size={16} />} 
                label="Critical" 
                color="text-primary"
                activeBg="bg-primary/10"
              />
              <TypeButton 
                active={type === 'info'} 
                onClick={() => setType('info')} 
                icon={<Info size={16} />} 
                label="Info" 
                color="text-secondary"
                activeBg="bg-secondary/10"
              />
              <TypeButton 
                active={type === 'broadcast'} 
                onClick={() => setType('broadcast')} 
                icon={<Radio size={16} />} 
                label="Broadcast" 
                color="text-tertiary"
                activeBg="bg-tertiary/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the update..."
              className="w-full bg-surface-container-highest border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information. Be specific about locations and times..."
              className="w-full bg-surface-container-highest border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Image URL (Optional)</label>
            <div className="relative">
              <input 
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surface-container-highest border border-black/5 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
              <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            </div>
          </div>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-tighter flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Send size={18} />
              Broadcast Report
            </motion.button>
            <p className="text-[10px] text-center mt-4 text-on-surface-variant uppercase tracking-widest font-bold">
              All reports are subject to community verification
            </p>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const TypeButton = ({ active, onClick, icon, label, color, activeBg }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string, activeBg: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
      active ? `${activeBg} ${color} border-current` : 'bg-surface-container-highest border-black/5 text-on-surface-variant grayscale opacity-60'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
