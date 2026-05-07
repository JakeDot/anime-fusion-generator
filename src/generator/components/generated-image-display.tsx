import React, { useState, useEffect } from 'react';
import { Download, Scissors, IterationCcw, Share2, Check, Twitter, Facebook, MessageCircle, Loader2, Maximize } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { GeneratedImage } from '../../types';
import { compressImageForFirestore } from '../utils/image-processing';
import { handleFirestoreError, OperationType } from '../../utils/firestore-error';

import { saveShardedImage } from '../../utils/firestore-sharding';

interface GeneratedImageDisplayProps {
  generatedImage: GeneratedImage;
  downloadImage: (image: GeneratedImage) => void;
  setIsEditing: (val: boolean) => void;
  onIterate: (image: GeneratedImage) => void;
  onUpscale?: (image: GeneratedImage) => void;
  children?: React.ReactNode;
}

export const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({
  generatedImage,
  downloadImage,
  setIsEditing,
  onIterate,
  onUpscale,
  children
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  useEffect(() => {
    setShareId(null);
  }, [generatedImage.id]);

  const handleShare = async (platform: 'x' | 'facebook' | 'whatsapp' | 'native' = 'native') => {
    if (!generatedImage || isSharing) return;
    setIsSharing(true);
    
    try {
      let currentShareId = shareId;

      if (!currentShareId) {
        try {
          currentShareId = await saveShardedImage('fusions', {
            prompt: generatedImage.prompt,
            series: generatedImage.series,
            authorId: auth.currentUser?.uid || 'anonymous'
          }, generatedImage.url);
          setShareId(currentShareId);
        } catch (error) {
          console.error("Failed to save sharded image to Firestore, falling back to local sharing:", error);
        }
      }

      const shareUrl = currentShareId 
        ? `${window.location.origin}/share/${currentShareId}`
        : window.location.origin;
      const text = `Check out this anime fusion: ${generatedImage.prompt}`;
      
      if (platform === 'x') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      } else if (platform === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
      } else {
        const shareData = { title: 'Anime Fusion', text, url: shareUrl };
        try {
          if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else {
            throw new Error("Web Share API not supported");
          }
        } catch (shareErr) {
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
    <div className="flex flex-col gap-4 w-full">
      <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/5 bg-neutral-900/50 group">
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
              {onUpscale && (
                <button 
                  onClick={() => onUpscale(generatedImage)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <Maximize className="w-4 h-4" /> Upscale
                </button>
              )}
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
        {children}
      </div>
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

      {/* Social Sharing Bar */}
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
    </div>
  );
};
