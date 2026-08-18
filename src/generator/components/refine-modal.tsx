import React, { useState } from 'react';
import { X, Sparkles, Wand2 } from 'lucide-react';
import { GeneratedImage } from '../../types';

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: GeneratedImage | null;
  onRefine: (image: GeneratedImage, refinePrompt: string) => void;
  isGenerating?: boolean;
}

export const RefineModal: React.FC<RefineModalProps> = ({
  isOpen,
  onClose,
  image,
  onRefine,
  isGenerating = false,
}) => {
  const [refinePrompt, setRefinePrompt] = useState('');

  if (!isOpen || !image) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRefine(image, refinePrompt);
    setRefinePrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Refine Fusion</h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">Enhance or modify this creation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/50 flex items-center justify-center">
              <img
                src={image.url}
                alt="Source for refinement"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                Optional Refinement Prompt
              </label>
              <div className="relative group">
                <textarea
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Describe desired modifications... (e.g., 'Add glowing aura', 'Change hair color to crimson', or leave empty for general enhancement)"
                  className="w-full h-28 bg-black border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="absolute bottom-3 right-3 text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                  Ctrl+Enter
                </div>
              </div>
              <p className="mt-2 text-[10px] text-neutral-500 font-mono leading-relaxed uppercase tracking-wider">
                Leaving this prompt empty will refine and enhance overall image quality, line detail, and lighting.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-neutral-800 text-neutral-300 rounded-2xl font-bold text-sm hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Refine Image
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
