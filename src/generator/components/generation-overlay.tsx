import React from 'react';

interface GenerationOverlayProps {
  isGenerating: boolean;
  isGeneratingMusic: boolean;
  draftImage: string | null;
}

export const GenerationOverlay: React.FC<GenerationOverlayProps> = ({
  isGenerating,
  isGeneratingMusic,
  draftImage
}) => {
  if (!isGenerating && !isGeneratingMusic) return null;

  return (
    <>
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
        <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
            Composing Anime Opening...
          </p>
        </div>
      )}
    </>
  );
};
