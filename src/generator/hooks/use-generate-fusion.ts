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
      const activeApiKey = userApiKey.trim() || API_KEY;
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      
      const [mimePart, data] = image.url.split(';base64,');
      const mimeType = mimePart.split(':')[1];

      const upscaleParts = [
        { inlineData: { data: data, mimeType: mimeType } },
        { text: "Upscale this image to high resolution, enhance details, sharp, masterpiece, 4k quality." }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: upscaleParts },
      });

      let base64Data = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }

      if (!base64Data) throw new Error("No upscaled image data received.");

      const upscaledUrl = `data:image/png;base64,${base64Data}`;

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
      const activeApiKey = userApiKey.trim() || API_KEY;
      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      
      const fullPrompt = buildGenerationPrompt({
        selectedSeries,
        customPrompt,
        negativePrompt,
        promptPrefix,
        transparentBackground,
        hasReferenceImages: referenceImages.length > 0
      });
 
      let finalPrompt = fullPrompt;
      if (externalModelsConfig && externalModelsConfig.activeSubtaskModel !== 'none') {
        setGenerationStatus(`Delegating prompt enhancement to ${externalModelsConfig.activeSubtaskModel}...`);
        try {
          finalPrompt = await delegateSubtaskToExternalModel(fullPrompt, externalModelsConfig);
          console.log("Enhanced prompt:", finalPrompt);
        } catch (err: any) {
          console.warn("External model subtask failed, falling back to original prompt", err);
          setError(`Subtask failed: ${err.message}. Falling back to direct generation.`);
        }
        setGenerationStatus(null);
      }

      const parts: any[] = [];
      referenceImages.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });
      parts.push({ text: finalPrompt });

      // STEP 1: Generate Draft
      const draftParts = [...parts, { text: "Generate a fast, low-detail conceptual draft of: " + finalPrompt }];
      const draftResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: draftParts },
      });

      let draftBase64 = "";
      for (const part of draftResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          draftBase64 = part.inlineData.data;
          break;
        }
      }

      if (!draftBase64) throw new Error("No draft image data received.");
      const draftUrl = `data:image/png;base64,${draftBase64}`;
      setDraftImage(draftUrl);

      // STEP 2: Generate Final
      const finalParts = [
        { inlineData: { data: draftBase64, mimeType: "image/png" } },
        { text: "Use this draft image as the exact base composition. Enhance, refine, and render it in extremely high quality and detail based on this description: " + finalPrompt }
      ];

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: { parts: finalParts },
      });

      let base64Data = "";
      let responseMetadata = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
        } else if (part.text) {
          responseMetadata = part.text;
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
        prompt: finalPrompt,
        series: [...selectedSeries],
        timestamp: Date.now(),
        metadata: responseMetadata,
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
      setDraftImage(null);
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
