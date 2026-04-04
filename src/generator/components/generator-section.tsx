import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Loader2, AlertCircle, RefreshCw, Download, Scissors, Share2, Check, Twitter, Facebook, MessageCircle, Undo2, Redo2, IterationCcw, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { GeneratedImage } from '../../types';
import { compressImageForFirestore } from '../utils/image-processing';

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
  generateFusion: () => void;
  generatedImage: GeneratedImage | null;
  draftImage: string | null;
  error: string | null;
  downloadImage: (image: GeneratedImage) => void;
  setIsEditing: (val: boolean) => void;
  onIterate: (image: GeneratedImage) => void;
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
  generateFusion,
  generatedImage,
  draftImage,
  error,
  downloadImage,
  setIsEditing,
  onIterate,
  onSettingsClick
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  // Reset shareId when image changes
  useEffect(() => {
    setShareId(null);
  }, [generatedImage?.id]);

  const handleShare = async (platform: 'x' | 'facebook' | 'whatsapp' | 'native' = 'native') => {
    if (!generatedImage || isSharing) return;
    setIsSharing(true);
    
    try {
      let currentShareId = shareId;

      if (!currentShareId) {
        // Compress image to ensure it fits within Firestore's 1MB document limit
        const compressedImageUrl = await compressImageForFirestore(generatedImage.url);

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'fusions'), {
          prompt: generatedImage.prompt,
          series: generatedImage.series,
          imageUrl: compressedImageUrl,
          createdAt: serverTimestamp(),
          authorId: auth.currentUser?.uid || 'anonymous'
        });
        
        currentShareId = docRef.id;
        setShareId(currentShareId);
      }

      const shareUrl = `${window.location.origin}/share/${currentShareId}`;
      const text = `Check out this anime fusion: ${generatedImage.prompt}`;
      
      if (platform === 'x') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      } else if (platform === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
      } else {
        const shareData = {
          title: 'Anime Fusion',
          text,
          url: shareUrl
        };

        try {
          if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else {
            throw new Error("Web Share API not supported");
          }
        } catch (shareErr) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(shareUrl);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }
      }
    } catch (err) {
      console.error("Failed to share:", err);
    } finally {
      setIsSharing(false);
    }
  };

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
                Fusing Elements...
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

        <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/5 bg-neutral-900/50 group">
          <AnimatePresence mode="wait">
            {generatedImage ? (
              <>
                <motion.div
                  key={generatedImage.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full relative"
                >
                  <img 
                    src={generatedImage.url} 
                    alt="Generated Fusion" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => downloadImage(generatedImage)}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors flex items-center gap-2 text-xs font-bold"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors flex items-center gap-2 text-xs font-bold"
                      >
                        <Scissors className="w-4 h-4" /> Edit
                      </button>
                      <button 
                        onClick={() => onIterate(generatedImage)}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors flex items-center gap-2 text-xs font-bold"
                      >
                        <IterationCcw className="w-4 h-4" /> Iterate
                      </button>
                    </div>
                    <div className="relative group/share">
                      <button 
                        onClick={() => handleShare('native')}
                        disabled={isSharing}
                        className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold w-24 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSharing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> ...</>
                        ) : isCopied ? (
                          <><Check className="w-4 h-4" /> Copied!</>
                        ) : (
                          <><Share2 className="w-4 h-4" /> Share</>
                        )}
                      </button>
                      
                      {/* Hover Menu */}
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/share:opacity-100 group-hover/share:visible transition-all translate-y-2 group-hover/share:translate-y-0 overflow-hidden z-10">
                        <div className="flex flex-col">
                          <button 
                            onClick={() => handleShare('x')}
                            className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-sm text-neutral-200"
                          >
                            <Twitter className="w-4 h-4" /> Share on X
                          </button>
                          <button 
                            onClick={() => handleShare('facebook')}
                            className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-sm text-neutral-200 border-t border-white/5"
                          >
                            <Facebook className="w-4 h-4" /> Share on Facebook
                          </button>
                          <button 
                            onClick={() => handleShare('whatsapp')}
                            className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-sm text-neutral-200 border-t border-white/5"
                          >
                            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                {generatedImage.audioUrl && (
                  <div className="mt-4">
                    <audio controls className="w-full h-10" src={generatedImage.audioUrl} />
                  </div>
                )}
                {generatedImage.metadata && (
                  <div className="mt-4">
                    <textarea
                      readOnly
                      value={generatedImage.metadata}
                      className="w-full h-24 p-4 bg-neutral-900/50 border border-white/5 rounded-xl text-xs text-neutral-300 focus:outline-none resize-none"
                    />
                  </div>
                )}
              </>
            ) : (
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
            )}
          </AnimatePresence>
          
          {isGenerating && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 overflow-hidden z-20">
              {draftImage && (
                <img 
                  src={draftImage} 
                  alt="Draft Background" 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 blur-2xl scale-110" 
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-6">
                {draftImage ? (
                  <>
                    <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                      <img 
                        src={draftImage} 
                        alt="Draft" 
                        className="w-full h-full object-cover" 
                        style={{ imageRendering: 'pixelated', filter: 'blur(2px)' }} 
                      />
                      <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest animate-pulse bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-indigo-500/20">
                        Refining High-Res Details...
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest animate-pulse">
                      Generating Initial Draft...
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          {isGeneratingMusic && !isGenerating && (
            <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
                Composing Anime Opening...
              </p>
            </div>
          )}
        </div>

        {/* Social Sharing Bar */}
        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 p-6 bg-neutral-900/50 border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-neutral-200">Share your Fusion</h3>
                <p className="text-xs text-neutral-500">Let the world see your creation</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleShare('x')}
                  disabled={isSharing}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-2xl transition-all hover:scale-110 disabled:opacity-50"
                  title="Share on X"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleShare('facebook')}
                  disabled={isSharing}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-2xl transition-all hover:scale-110 disabled:opacity-50"
                  title="Share on Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleShare('whatsapp')}
                  disabled={isSharing}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-2xl transition-all hover:scale-110 disabled:opacity-50"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-white/10 mx-1" />
                <button 
                  onClick={() => handleShare('native')}
                  disabled={isSharing}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isCopied ? (
                    <><Check className="w-4 h-4" /> Copied!</>
                  ) : (
                    <><Share2 className="w-4 h-4" /> Copy Link</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
