/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedImage, ReferenceImage } from '../types';
import { injectMetadata } from './utils/pngMetadata';
import { processTransparency } from './utils/imageProcessing';
import { Header, MobileNav, Footer } from './components/Layout';
import { SeriesGrid } from '../series/SeriesGrid';
import { ImageUploader } from './components/ImageUploader';
import { GeneratorSection } from './components/GeneratorSection';
import { HistorySection } from '../history/HistorySection';
import { EditModal } from './components/EditModal';
import { SettingsModal } from './components/SettingsModal';
import { StatusModal } from './components/StatusModal';
import { ImpressumModal } from './components/ImpressumModal';
import { useUndoRedo } from './hooks/useUndoRedo';
import { motion, AnimatePresence } from 'motion/react';

import metadata from '../../metadata.json';
import PREDEFINED_SERIES from '../series/series.json';

const API_KEY = process.env.GEMINI_API_KEY || "";

export function GeneratorPage() {
  // --- State ---
  const { state: undoState, update: updateUndoState, commit: commitUndoState, setAndCommit, undo, redo, canUndo, canRedo } = useUndoRedo({ prompt: "", series: [] });
  const selectedSeries = undoState.series;
  const customPrompt = undoState.prompt;

  const [customSeries, setCustomSeries] = useState<string[]>([]);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [promptPrefix, setPromptPrefix] = useState("");
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_api_key') || "");
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [generateMusic, setGenerateMusic] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isImpressumOpen, setIsImpressumOpen] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Handlers ---
  const setCustomPrompt = (val: string) => {
    updateUndoState({ prompt: val });
  };

  const setSelectedSeries = (updater: (prev: string[]) => string[]) => {
    setAndCommit({ series: updater(undoState.series) });
  };
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  };

  const processFiles = (files: FileList) => {
    (Array.from(files) as File[]).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const [mime, data] = base64.split(';base64,');
        setReferenceImages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          data: data,
          mimeType: mime.split(':')[1]
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const removeImage = (id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const addCustomSeries = () => {
    if (newSeriesName.trim()) {
      setCustomSeries(prev => [...prev, newSeriesName.trim()]);
      setSelectedSeries(prev => [...prev, `custom-${newSeriesName.trim()}`]);
      setNewSeriesName("");
    }
  };

  const removeCustomSeries = (name: string) => {
    setCustomSeries(prev => prev.filter(s => s !== name));
    setSelectedSeries(prev => prev.filter(s => s !== `custom-${name}`));
  };

  const toggleSeries = (id: string) => {
    setSelectedSeries(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const downloadImage = async (image: GeneratedImage) => {
    try {
      const pngMetadata: Record<string, string> = {
        'Prompt': image.prompt,
        'Software': 'Anime Fusion Generator',
        'Version': (metadata as any).version || '0.5',
        'Series': image.series.join(', '),
        'Timestamp': new Date(image.timestamp).toISOString()
      };

      const imageUrlWithMetadata = injectMetadata(image.url, pngMetadata);
      
      const link = document.createElement('a');
      link.href = imageUrlWithMetadata;
      link.download = `anime-fusion-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `anime-fusion-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleIterate = (image: GeneratedImage) => {
    // Extract base64 and mime type
    const [mimePart, data] = image.url.split(';base64,');
    const mimeType = mimePart.split(':')[1];
    
    // Add to reference images
    setReferenceImages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      data: data,
      mimeType: mimeType
    }]);

    // Set prompt and series
    setAndCommit({
      prompt: image.prompt,
      series: image.series
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateFusion = async () => {
    if (selectedSeries.length === 0 && !customPrompt && referenceImages.length === 0) {
      setError("Please select a series, enter a prompt, or upload an image.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const activeApiKey = userApiKey.trim() || API_KEY;
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      
      const selectedPredefined = selectedSeries
        .filter(id => !id.startsWith('custom-'))
        .map(id => PREDEFINED_SERIES.find(s => s.id === id)?.name);
      
      const selectedCustom = selectedSeries
        .filter(id => id.startsWith('custom-'))
        .map(id => id.replace('custom-', ''));

      const allSeries = [...selectedPredefined, ...selectedCustom].join(", ");
      
      let fullPrompt = "";
      if (promptPrefix) {
        fullPrompt += `${promptPrefix.trim()} `;
      }
      if (allSeries) {
        fullPrompt += `Anime style fusion of ${allSeries}. `;
      }
      if (customPrompt) {
        fullPrompt += `${customPrompt}. `;
      }
      if (referenceImages.length > 0) {
        fullPrompt += `CRITICAL: Combine the visual elements from ALL provided reference images into a single new composition. Do not just reproduce one of the images. `;
      }
      if (transparentBackground) {
        fullPrompt += "The subject should be on a plain white background for easy transparency removal. ";
      }
      fullPrompt += "High quality, detailed anime art.";

      const parts: any[] = [];
      referenceImages.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });
      parts.push({ text: fullPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
      });

      let base64Data = "";
      let metadata = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
        } else if (part.text) {
          metadata = part.text;
        }
      }

      if (!base64Data) throw new Error("No image data received.");

      let imageUrl = `data:image/png;base64,${base64Data}`;
      
      if (transparentBackground || fullPrompt.toLowerCase().includes("transparent") || fullPrompt.toLowerCase().includes("transparency")) {
        imageUrl = await processTransparency(imageUrl);
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: fullPrompt,
        series: [...selectedSeries],
        timestamp: Date.now(),
        metadata: metadata,
      };

      setGeneratedImage(newImage);
      setHistory(prev => [newImage, ...prev]);

      if (generateMusic) {
        setIsGeneratingMusic(true);
        try {
          let musicApiKey = activeApiKey;
          if ((window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
              await (window as any).aistudio.openSelectKey();
            }
            musicApiKey = process.env.API_KEY || activeApiKey;
          }
          
          const musicAi = new GoogleGenAI({ apiKey: musicApiKey });
          
          const musicResponse = await musicAi.models.generateContentStream({
            model: "lyria-3-clip-preview",
            contents: {
              parts: [
                { text: `Generate a 30-second anime opening style track inspired by this image and prompt: ${fullPrompt}` },
                { inlineData: { data: base64Data, mimeType: "image/png" } },
              ],
            },
          });

          let audioBase64 = "";
          let audioMimeType = "audio/wav";

          for await (const chunk of musicResponse) {
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (!parts) continue;
            for (const part of parts) {
              if (part.inlineData?.data) {
                if (!audioBase64 && part.inlineData.mimeType) {
                  audioMimeType = part.inlineData.mimeType;
                }
                audioBase64 += part.inlineData.data;
              }
            }
          }

          if (audioBase64) {
            const binary = atob(audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: audioMimeType });
            const audioUrl = URL.createObjectURL(blob);
            
            newImage.audioUrl = audioUrl;
            setGeneratedImage({ ...newImage });
            setHistory(prev => prev.map(img => img.id === newImage.id ? { ...newImage } : img));
          }
        } catch (musicErr: any) {
          console.error("Music generation error:", musicErr);
          setError(prev => prev ? prev + " | Music failed: " + musicErr.message : "Music failed: " + musicErr.message);
        } finally {
          setIsGeneratingMusic(false);
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Background Ambience */}
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

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} />

        <SeriesGrid 
          predefinedSeries={PREDEFINED_SERIES}
          selectedSeries={selectedSeries}
          customSeries={customSeries}
          newSeriesName={newSeriesName}
          setNewSeriesName={setNewSeriesName}
          toggleSeries={toggleSeries}
          addCustomSeries={addCustomSeries}
          removeCustomSeries={removeCustomSeries}
        />

        <ImageUploader 
          referenceImages={referenceImages}
          isDragging={isDragging}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
          fileInputRef={fileInputRef}
        />

        <GeneratorSection 
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          commitPrompt={commitUndoState}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          transparentBackground={transparentBackground}
          setTransparentBackground={setTransparentBackground}
          generateMusic={generateMusic}
          setGenerateMusic={setGenerateMusic}
          isGenerating={isGenerating}
          isGeneratingMusic={isGeneratingMusic}
          generateFusion={generateFusion}
          generatedImage={generatedImage}
          error={error}
          downloadImage={downloadImage}
          setIsEditing={setIsEditing}
          onIterate={handleIterate}
        />

        <HistorySection 
          history={history}
          setHistory={setHistory}
          downloadImage={downloadImage}
          onIterate={handleIterate}
        />
        
        <Footer 
          onStatusClick={() => setIsStatusOpen(true)} 
          onImpressumClick={() => setIsImpressumOpen(true)}
        />
      </main>

      <EditModal 
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        generatedImage={generatedImage}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        promptPrefix={promptPrefix}
        setPromptPrefix={setPromptPrefix}
        userApiKey={userApiKey}
        setUserApiKey={(key) => {
          setUserApiKey(key);
          if (key.trim()) {
            localStorage.setItem('gemini_api_key', key.trim());
          } else {
            localStorage.removeItem('gemini_api_key');
          }
        }}
      />

      <StatusModal 
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        apiKey={userApiKey.trim() || API_KEY}
      />

      <ImpressumModal 
        isOpen={isImpressumOpen}
        onClose={() => setIsImpressumOpen(false)}
      />

      <MobileNav onSettingsClick={() => setIsSettingsOpen(true)} />
    </div>
  );
}
