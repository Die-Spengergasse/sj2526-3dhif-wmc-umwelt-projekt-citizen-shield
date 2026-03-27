import React from 'react';
import { Shield, Bell, ShieldCheck } from 'lucide-react';

interface TopNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const TopNav = ({ currentView, onViewChange }: TopNavProps) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl flex justify-between items-center px-6 py-4 border-b border-black/5">
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => onViewChange('hub')}
      >
        <div className="relative">
          <ShieldCheck size={28} className="text-primary group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-black tracking-tighter text-on-surface uppercase font-headline">CITIZEN SHIELD</div>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        <NavLink label="Hub" active={currentView === 'hub'} onClick={() => onViewChange('hub')} />
        <NavLink label="Regions" active={currentView === 'regions'} onClick={() => onViewChange('regions')} />
        <NavLink label="Community" active={currentView === 'community'} onClick={() => onViewChange('community')} />
        <NavLink label="Security" active={currentView === 'security'} onClick={() => onViewChange('security')} />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center bg-surface-container px-3 py-1.5 rounded-xl">
          <Shield size={14} className="text-on-surface-variant mr-2" />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Community Shield</span>
        </div>
        
        <button className="p-2 text-on-surface hover:text-primary transition-colors">
          <Bell size={20} />
        </button>
        
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant/30">
          <img 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp8kM6_oY42ZtGXl86OnR5OUaSY8TqCMDSsG-uINsILa6UL3v0pq4tjY8z03Vs9Vx0vDXPBPZwBHciUbah42In-6_gr82psFkEp5huZ1_Aqrgf9h1mU8Oo9LSRveVfjMERq2jrSuy79OPfX4KxNMOw8oVKNqbVXpGtHUh6pg4WtqQ8OqvaCNPdd5DeFtgqyxxmi9IuQbQtlDEcX_s-Hvz9HA_Q5u6HvcGEeqdRpi1SG-ZhLK0uh1xgcc-2FyZRlHkJ5jCFQXNlUDA" 
            alt="User Avatar"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ label, active = false, onClick }: { label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`font-headline font-bold tracking-tight transition-all cursor-pointer relative py-1 ${
      active ? 'text-primary' : 'text-gray-500 hover:text-gray-200'
    }`}
  >
    {label}
    {active && (
      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
    )}
  </button>
);
