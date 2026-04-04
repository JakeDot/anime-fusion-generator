import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, AlertCircle, ArrowLeft, Download, Share2, Check, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const SharePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [fusion, setFusion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchFusion = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'fusions', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setFusion(docSnap.data());
        } else {
          setError("Fusion not found. The link might be broken or the image was removed.");
        }
      } catch (err) {
        console.error("Error fetching fusion:", err);
        setError("Failed to load the fusion. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFusion();
  }, [id]);

  const downloadImage = () => {
    if (!fusion) return;
    const link = document.createElement('a');
    link.href = fusion.imageUrl;
    link.download = `anime-fusion-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (platform: 'x' | 'facebook' | 'whatsapp' | 'native' = 'native') => {
    if (!fusion) return;
    
    const shareUrl = window.location.href;
    const text = `Check out this anime fusion: ${fusion.prompt}`;
    
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-neutral-400 font-mono uppercase tracking-widest text-sm">Loading Fusion...</p>
      </div>
    );
  }

  if (error || !fusion) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-4 text-center">Oops!</h1>
        <p className="text-neutral-400 text-center max-w-md mb-8">{error}</p>
        <Link 
          to="/"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Generator
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 font-mono text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Create Your Own
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="md:flex">
            <div className="md:w-2/3 bg-black aspect-square relative flex items-center justify-center">
              <img 
                src={fusion.imageUrl} 
                alt="Shared Anime Fusion" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="md:w-1/3 p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10">
              <div>
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                  Fusion Details
                </h1>
                
                <div className="mb-6">
                  <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2">Prompt</h3>
                  <p className="text-sm text-neutral-300 leading-relaxed bg-black/50 p-4 rounded-xl border border-white/5">
                    "{fusion.prompt}"
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2">Series Combined</h3>
                  <div className="flex flex-wrap gap-2">
                    {fusion.series.map((s: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-3">
                <button 
                  onClick={downloadImage}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> Download Image
                </button>
                
                <div className="relative group/share w-full">
                  <button 
                    onClick={() => handleShare('native')}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {isCopied ? (
                      <><Check className="w-5 h-5" /> Copied Link!</>
                    ) : (
                      <><Share2 className="w-5 h-5" /> Share Fusion</>
                    )}
                  </button>
                  
                  {/* Hover Menu */}
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-neutral-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/share:opacity-100 group-hover/share:visible transition-all translate-y-2 group-hover/share:translate-y-0 overflow-hidden z-10">
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
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
