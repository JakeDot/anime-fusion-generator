import React from 'react';
import { ImageIcon, Wand2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploaderProps {
  referenceImages: any[];
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  referenceImages,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleImageUpload,
  removeImage,
  fileInputRef
}) => {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
          Reference Images
        </h2>
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
          {referenceImages.length} Uploaded
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group p-8 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden ${
            isDragging 
              ? 'bg-emerald-500/10 border-emerald-500 scale-[0.98]' 
              : 'bg-neutral-900/50 border-white/5 hover:border-white/20 hover:bg-neutral-800/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
            isDragging ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700'
          }`}>
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-neutral-300">Drop images here</p>
            <p className="text-xs text-neutral-500 mt-1">or click to browse</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </motion.div>

        <AnimatePresence mode="popLayout">
          {referenceImages.map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-square rounded-3xl overflow-hidden border border-white/5 bg-neutral-900"
            >
              <img 
                src={`data:${img.mimeType};base64,${img.data}`} 
                alt="Reference" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => removeImage(img.id)}
                  className="p-2 bg-red-500 text-white rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-mono text-white/80 uppercase tracking-tighter">
                {img.mimeType.split('/')[1]}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};
