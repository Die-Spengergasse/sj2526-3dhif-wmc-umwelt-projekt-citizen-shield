import React from 'react';
import { motion } from 'motion/react';

interface TimelineItemProps {
  time: string;
  title: string;
  description: string;
  type: 'critical' | 'info' | 'broadcast';
  image?: string;
  tags?: string[];
  icon?: React.ReactNode;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ time, title, description, type, image, tags, icon }) => {
  const borderColor = {
    critical: 'border-primary',
    info: 'border-secondary',
    broadcast: 'border-tertiary'
  }[type];

  const dotColor = {
    critical: 'bg-primary-dim',
    info: 'bg-secondary',
    broadcast: 'bg-tertiary'
  }[type];

  const bgColor = type === 'broadcast' ? 'bg-surface-container-low' : 'bg-surface-container';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative pl-12 mb-12"
    >
      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full ${dotColor} border-4 border-background z-10 shadow-sm`} />
      
      <div className={`${bgColor} rounded-xl p-8 border-l-4 ${borderColor} border-y border-r border-black/5`}>
        <div className="flex justify-between items-start mb-4">
          <span className={`text-xs font-bold font-headline uppercase tracking-widest ${
            type === 'critical' ? 'text-primary' : type === 'info' ? 'text-secondary' : 'text-on-surface-variant'
          }`}>
            {time}
          </span>
          {icon && <div className={type === 'critical' ? 'text-primary' : 'text-secondary'}>{icon}</div>}
        </div>
        
        <h4 className={`text-2xl font-bold font-headline mb-4 ${type === 'broadcast' ? 'italic' : ''}`}>
          {type === 'broadcast' ? `"${title}"` : title}
        </h4>
        
        <p className={`text-on-surface-variant leading-relaxed ${image ? 'mb-6' : ''} ${type === 'broadcast' ? 'italic text-lg' : ''}`}>
          {description}
        </p>
        
        {image && (
          <div className="rounded-lg overflow-hidden h-48 w-full bg-surface-container-highest">
            <img 
              className="w-full h-full object-cover grayscale opacity-80" 
              src={image} 
              alt={title}
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        
        {tags && (
          <div className="mt-4 flex gap-2">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-surface-container text-[10px] text-on-surface-variant rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
