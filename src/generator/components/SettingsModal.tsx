import React, { useState, useEffect } from 'react';
import { X, Type, Key, Clock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptPrefix: string;
  setPromptPrefix: (prefix: string) => void;
  userApiKey: string;
  setUserApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  promptPrefix,
  setPromptPrefix,
  userApiKey,
  setUserApiKey,
}) => {
  const [autoDreamEnabled, setAutoDreamEnabled] = useState(false);

  useEffect(() => {
    setAutoDreamEnabled(localStorage.getItem('auto_dream_enabled') === 'true');
  }, [isOpen]);

  const handleAutoDreamToggle = () => {
    const newVal = !autoDreamEnabled;
    setAutoDreamEnabled(newVal);
    localStorage.setItem('auto_dream_enabled', newVal.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <Type className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Generation Settings</h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">Configure your engine</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Custom Gemini API Key
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder="Leave empty to use default configuration"
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <p className="mt-2 text-[10px] text-neutral-500 font-mono leading-relaxed uppercase tracking-wider">
                Your key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                Permanent Prompt Prefix
              </label>
              <div className="relative group">
                <textarea
                  value={promptPrefix}
                  onChange={(e) => setPromptPrefix(e.target.value)}
                  placeholder="e.g. Masterpiece, high quality, 8k resolution..."
                  className="w-full h-32 bg-black border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <p className="mt-2 text-[10px] text-neutral-500 font-mono leading-relaxed uppercase tracking-wider">
                This text will be prepended to every prompt sent to the neural engine.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Auto Dream Service
              </label>
              <div className="flex items-center justify-between bg-black border border-white/5 rounded-2xl p-4">
                <span className="text-sm text-neutral-300">Generate a random fusion every hour</span>
                <button 
                  onClick={handleAutoDreamToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoDreamEnabled ? 'bg-indigo-600' : 'bg-neutral-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoDreamEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-neutral-500 font-mono leading-relaxed uppercase tracking-wider">
                Requires the app to be open. Randomly selects series and prompts.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm hover:bg-neutral-200 transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
