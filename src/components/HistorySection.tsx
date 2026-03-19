import React from 'react';
import { History, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedImage } from '../types';

interface HistorySectionProps {
  history: GeneratedImage[];
  setHistory: (val: GeneratedImage[]) => void;
  downloadImage: (image: GeneratedImage) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  setHistory,
  downloadImage
}) => {
  if (history.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-2 h-8 bg-neutral-500 rounded-full"></span>
          Fusion History
        </h2>
        <button 
          onClick={() => setHistory([])}
          className="text-xs font-mono text-neutral-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-3 h-3" /> Clear History
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {history.map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-square rounded-2xl overflow-hidden border border-white/5 bg-neutral-900"
            >
              <img 
                src={img.url} 
                alt="Fusion History" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => downloadImage(img)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-mono text-white/80 uppercase tracking-tighter truncate">
                {img.series.join(' + ')}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};
