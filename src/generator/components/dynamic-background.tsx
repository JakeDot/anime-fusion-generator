import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedImage } from '../../types';

interface DynamicBackgroundProps {
  generatedImage: GeneratedImage | null;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ generatedImage }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div 
        animate={{
          x: mousePos.x * 0.05,
          y: mousePos.y * 0.05,
          scale: generatedImage ? 1.2 : 1
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"
      />
      <motion.div 
        animate={{
          x: mousePos.x * -0.05,
          y: mousePos.y * -0.05,
          scale: generatedImage ? 1.2 : 1
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full"
      />
      <AnimatePresence>
        {generatedImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1 }}
            className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
