import React from 'react';
import { Sparkles, Wand2, Settings2 } from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-16">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg border border-white/5 rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden">
            <img 
              src="/anime-fusion.png" 
              alt="Anime Fusion Logo" 
              className="w-full h-full object-contain p-2" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg animate-bounce">
            <Wand2 className="w-3 h-3 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-neutral-500 bg-clip-text text-transparent">
            ANIME FUSION
          </h1>
          <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">
            Neural Style Synthesis Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-3 p-1.5 bg-neutral-900/50 border border-white/5 rounded-2xl backdrop-blur-md">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Generator
          </button>
          <button 
            onClick={onSettingsClick}
            className="px-4 py-2 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Settings2 className="w-3 h-3" /> Settings
          </button>
        </div>
        <img 
          src="/logo-jakedot.png" 
          alt="Jakedot Logo" 
          className="h-12 w-auto opacity-80 hover:opacity-100 transition-all drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
          referrerPolicy="no-referrer" 
        />
      </div>
    </header>
  );
};

interface MobileNavProps {
  onSettingsClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onSettingsClick }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-neutral-950/80 backdrop-blur-md border-t border-white/5 px-6 py-4 flex items-center justify-around">
      <button className="p-2 text-indigo-500"><Sparkles className="w-6 h-6" /></button>
      <button 
        onClick={onSettingsClick}
        className="p-2 text-neutral-500"
      >
        <Settings2 className="w-6 h-6" />
      </button>
    </nav>
  );
};

interface FooterProps {
  onStatusClick: () => void;
  onImpressumClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onStatusClick, onImpressumClick }) => {
  return (
    <footer className="mt-24 pt-12 pb-24 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8 text-neutral-600">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-neutral-400">ANIME FUSION GENERATOR</p>
          <p className="text-[10px] font-mono uppercase tracking-widest">v0.6 Neural Synthesis</p>
        </div>
      </div>
      <div className="flex items-center gap-8 text-[10px] font-mono uppercase tracking-widest">
        <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
        <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
        <button 
          onClick={(e) => {
            e.preventDefault();
            onImpressumClick();
          }}
          className="hover:text-indigo-400 transition-colors cursor-pointer"
        >
          Impressum
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            onStatusClick();
          }}
          className="hover:text-indigo-400 transition-colors cursor-pointer"
        >
          API Status
        </button>
      </div>
      <p className="text-[10px] font-mono uppercase tracking-widest">
        &copy; 2026 JAKEDOT.NET
      </p>
    </footer>
  );
};
