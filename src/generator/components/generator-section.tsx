import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Loader2, AlertCircle, RefreshCw, Undo2, Redo2, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedImage } from '../../types';
import { GenerationOverlay } from './generation-overlay';
import { GeneratedImageDisplay } from './generated-image-display';

interface GeneratorSectionProps {
  customPrompt: string;
  setCustomPrompt: (val: string) => void;
  negativePrompt: string;
  setNegativePrompt: (val: string) => void;
  commitPrompt: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  transparentBackground: boolean;
  setTransparentBackground: (val: boolean) => void;
  generateMusic: boolean;
  setGenerateMusic: (val: boolean) => void;
  isGenerating: boolean;
  isGeneratingMusic: boolean;
  generationStatus?: string | null;
  generateFusion: () => void;
  generatedImage: GeneratedImage | null;
  draftImage: string | null;
  error: string | null;
  downloadImage: (image: GeneratedImage) => void;
  setIsEditing: (val: boolean) => void;
  onIterate: (image: GeneratedImage) => void;
  onUpscale: (image: GeneratedImage) => void;
  onSettingsClick: () => void;
}

export const GeneratorSection: React.FC<GeneratorSectionProps> = ({
  customPrompt,
  setCustomPrompt,
  negativePrompt,
  setNegativePrompt,
  commitPrompt,
  undo,
  redo,
  canUndo,
  canRedo,
  transparentBackground,
  setTransparentBackground,
  generateMusic,
  setGenerateMusic,
  isGenerating,
  isGeneratingMusic,
  generationStatus,
  generateFusion,
  generatedImage,
  draftImage,
  error,
  downloadImage,
  setIsEditing,
  onIterate,
  onUpscale,
  onSettingsClick
}) => {
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
          Fusion Engine
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
            className={`p-2 rounded-xl transition-colors ${showAdvancedInfo ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'}`}
            title="Advanced Prompting Info"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors mr-2"
            title="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-4">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <label className="flex items-center gap-3 cursor-pointer group mr-4 border-r border-white/10 pr-4">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest group-hover:text-neutral-300 transition-colors">
              Music
            </span>
            <div 
              onClick={() => setGenerateMusic(!generateMusic)}
              className={`w-10 h-5 rounded-full p-1 transition-colors ${generateMusic ? 'bg-indigo-600' : 'bg-neutral-800'}`}
            >
              <motion.div 
                animate={{ x: generateMusic ? 20 : 0 }}
                className="w-3 h-3 bg-white rounded-full shadow-lg"
              />
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest group-hover:text-neutral-300 transition-colors">
              Transparent BG
            </span>
            <div 
              onClick={() => setTransparentBackground(!transparentBackground)}
              className={`w-10 h-5 rounded-full p-1 transition-colors ${transparentBackground ? 'bg-indigo-600' : 'bg-neutral-800'}`}
            >
              <motion.div 
                animate={{ x: transparentBackground ? 20 : 0 }}
                className="w-3 h-3 bg-white rounded-full shadow-lg"
              />
            </div>
          </label>
        </div>
      </div>

      <AnimatePresence>
        {showAdvancedInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Advanced Prompting Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-neutral-400 leading-relaxed">
                <div>
                  <p className="font-bold text-neutral-200 mb-1">Weighted Keywords</p>
                  <p>Use <code className="text-indigo-400 font-mono">(keyword:weight)</code> to emphasize elements. Weights above 1.0 increase importance, below 1.0 decrease it.</p>
                  <p className="mt-2 font-mono text-[10px]">Example: (cyberpunk:1.5), (vintage:0.5)</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-200 mb-1">Negative Prompts</p>
                  <p>Use the negative prompt field to specify elements you want to EXCLUDE from the neural synthesis.</p>
                  <p className="mt-2 font-mono text-[10px]">Example: blurry, low quality, extra limbs, text</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <textarea 
                placeholder="Describe your fusion... (e.g., 'A character with Luffy's hat and Naruto's whiskers, wearing a Survey Corps cloak')"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onBlur={commitPrompt}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    commitPrompt();
                    if (!isGenerating) generateFusion();
                  }
                }}
                className="w-full h-48 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none group-hover:bg-neutral-800/50"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                <span>Prompt Engineering</span>
                <span className="px-1.5 py-0.5 bg-neutral-800 rounded-md border border-white/5">Ctrl+Enter</span>
              </div>
            </div>

            <div className="relative group">
              <textarea 
                placeholder="Negative Prompt: What to exclude... (e.g., 'blurry, low quality, distorted hands')"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="w-full h-24 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 text-sm focus:outline-none focus:border-red-500/30 transition-all resize-none group-hover:bg-neutral-800/50"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-mono text-red-900/50 uppercase tracking-widest">
                <span>Negative Space</span>
              </div>
            </div>
          </div>

          <button 
            onClick={generateFusion}
            disabled={isGenerating}
            className={`w-full py-6 rounded-3xl font-bold text-lg transition-all flex items-center justify-center gap-4 relative overflow-hidden group ${
              isGenerating 
                ? 'bg-neutral-800 text-neutral-500 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {generationStatus || 'Fusing Elements...'}
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                Generate Fusion
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {generatedImage ? (
              <GeneratedImageDisplay 
                generatedImage={generatedImage}
                downloadImage={downloadImage}
                setIsEditing={setIsEditing}
                onIterate={onIterate}
                onUpscale={onUpscale}
              >
                <GenerationOverlay 
                  isGenerating={isGenerating}
                  isGeneratingMusic={isGeneratingMusic}
                  draftImage={draftImage}
                />
              </GeneratedImageDisplay>
            ) : (
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/5 bg-neutral-900/50 group">
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-neutral-600">
                  <div className="w-24 h-24 rounded-full bg-neutral-800/50 flex items-center justify-center relative">
                    <Wand2 className="w-10 h-10" />
                    <div className="absolute inset-0 border-2 border-dashed border-neutral-700 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Waiting for fusion...</p>
                    <p className="text-xs mt-1">Select series and describe your vision</p>
                  </div>
                </div>
                <GenerationOverlay 
                  isGenerating={isGenerating}
                  isGeneratingMusic={isGeneratingMusic}
                  draftImage={draftImage}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
