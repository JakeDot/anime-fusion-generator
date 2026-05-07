import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedImage, ReferenceImage, ExternalModelsConfig } from '../../types';
import { injectMetadata } from '../utils/png-metadata';
import { processTransparency } from '../utils/image-processing';
import metadata from '../../../metadata.json';
import { buildGenerationPrompt } from '../utils/prompt-builder';
import { delegateSubtaskToExternalModel } from '../../utils/external-ai';

const API_KEY = process.env.GEMINI_API_KEY || "";

interface UseGenerateFusionProps {
  selectedSeries: string[];
  customPrompt: string;
  negativePrompt: string;
  referenceImages: ReferenceImage[];
  transparentBackground: boolean;
  generateMusic: boolean;
  userApiKey: string;
  selectedModel: string;
  promptPrefix: string;
  setReferenceImages: React.Dispatch<React.SetStateAction<ReferenceImage[]>>;
  setAndCommit: (state: any) => void;
  externalModelsConfig: ExternalModelsConfig;
}

export function useGenerateFusion({
  selectedSeries,
  customPrompt,
  negativePrompt,
  referenceImages,
  transparentBackground,
  generateMusic,
  userApiKey,
  selectedModel,
  promptPrefix,
  setReferenceImages,
  setAndCommit,
  externalModelsConfig
}: UseGenerateFusionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const handleUpscale = async (image: GeneratedImage) => {
    setIsGenerating(true);
    setError(null);
    try {
      const activeApiKey = userApiKey.trim();

      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, apiKey: activeApiKey })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upscale image");
      }

      const { url: upscaledUrl } = await res.json();

      const upscaledImage: GeneratedImage = {
        ...image,
        id: Date.now().toString(),
        url: upscaledUrl,
        prompt: image.prompt + " (Upscaled)",
        timestamp: Date.now(),
      };

      setGeneratedImage(upscaledImage);
      setHistory(prev => [upscaledImage, ...prev]);
    } catch (err: any) {
      console.error("Upscale error:", err);
      setError(err.message || "Failed to upscale image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFusion = async () => {
    if (selectedSeries.length === 0 && !customPrompt && referenceImages.length === 0) {
      setError("Please select a series, enter a prompt, or upload an image.");
      return;
    }

    setIsGenerating(true);
    setDraftImage(null);
    setError(null);

    try {
      const activeApiKey = userApiKey.trim();
      
      const payload = {
        series: selectedSeries,
        prompt: customPrompt,
        negativePrompt,
        promptPrefix,
        transparentBackground,
        referenceImages,
        model: selectedModel,
        apiKey: activeApiKey
      };

      // Since we don't stream draft progression over HTTP yet, we'll just wait for final image.
      // We can update generating status
      setGenerationStatus("Synthesizing fusion...");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate image.");
      }

      const imageUrl = data.url;

      const newImage: GeneratedImage = {
        id: data.id,
        url: imageUrl,
        prompt: data.prompt,
        series: [...selectedSeries],
        timestamp: data.timestamp,
        metadata: data.metadata,
      };

      setGeneratedImage(newImage);
      setHistory(prev => [newImage, ...prev]);

      if (generateMusic) {
        setIsGeneratingMusic(true);
        try {
          let musicApiKey = activeApiKey;
          if ((window as any).aistudio && !musicApiKey) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
              await (window as any).aistudio.openSelectKey();
            }
            musicApiKey = process.env.GEMINI_API_KEY || activeApiKey;
          }
          
          const audioRes = await fetch("/api/music", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: data.prompt,
              imageBase64: imageUrl.split(",")[1] || imageUrl,
              apiKey: musicApiKey
            })
          });

          if (!audioRes.ok) {
            const errData = await audioRes.json();
            throw new Error(errData.error || "Failed to generate music");
          }

          const { audioBase64, audioMimeType } = await audioRes.json();

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
      setDraftImage(null);
      setGenerationStatus(null);
    }
  };

  return {
    isGenerating,
    isGeneratingMusic,
    generationStatus,
    generatedImage,
    draftImage,
    history,
    setHistory,
    error,
    generateFusion,
    downloadImage,
    handleIterate,
    handleUpscale
  };
}
