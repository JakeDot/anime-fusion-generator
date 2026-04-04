import React from 'react';
import { Scissors, X, Sliders, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { GeneratedImage } from '../../types';

interface EditModalProps {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  generatedImage: GeneratedImage | null;
  crop: { x: number; y: number };
  setCrop: (val: { x: number; y: number }) => void;
  zoom: number;
  setZoom: (val: number) => void;
  onCropComplete: (_croppedArea: any, croppedAreaPixels: any) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isEditing,
  setIsEditing,
  generatedImage,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete
}) => {
  return (
    <AnimatePresence>
      {isEditing && generatedImage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Scissors className="w-6 h-6" />
              Edit Fusion
            </h2>
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 relative bg-neutral-900 rounded-3xl overflow-hidden border border-white/5">
            <Cropper
              image={generatedImage.url}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-6">
              <Sliders className="w-5 h-5 text-neutral-500" />
              <input 
                type="range" 
                min={1} 
                max={3} 
                step={0.1} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
