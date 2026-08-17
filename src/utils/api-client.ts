import { GoogleGenAI } from "@google/genai";
import { buildGenerationPrompt } from "../generator/utils/prompt-builder";
import { injectMetadata } from "../generator/utils/png-metadata";
import metadata from "../../metadata.json";

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || "";

function getApiKey(userApiKey?: string): string {
  return (
    userApiKey?.trim() ||
    localStorage.getItem("gemini_api_key") ||
    DEFAULT_API_KEY
  );
}

export interface GenerateParams {
  series?: string[];
  prompt?: string;
  negativePrompt?: string;
  promptPrefix?: string;
  referenceImages?: Array<{ data: string; mimeType?: string }>;
  transparentBackground?: boolean;
  model?: string;
  apiKey?: string;
}

export interface GenerateResult {
  id: string;
  url: string;
  prompt: string;
  metadata?: string;
  timestamp: number;
}

export async function generateFusionImage(params: GenerateParams): Promise<GenerateResult> {
  const activeApiKey = getApiKey(params.apiKey);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, apiKey: activeApiKey }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend /api/generate unavailable, using client-side Gemini fallback.", err);
  }

  // Fallback: direct client-side call with @google/genai
  if (!activeApiKey) {
    throw new Error("Missing API Key. Please provide a Gemini API Key in settings.");
  }

  const ai = new GoogleGenAI({ apiKey: activeApiKey });
  const {
    series = [],
    prompt = "",
    negativePrompt = "",
    promptPrefix = "",
    referenceImages = [],
    transparentBackground = false,
    model = "gemini-2.0-flash-exp",
  } = params;

  const generationPrompt = buildGenerationPrompt({
    selectedSeries: series,
    customPrompt: prompt,
    negativePrompt,
    promptPrefix,
    transparentBackground,
    hasReferenceImages: referenceImages.length > 0,
  });

  const parts: any[] = [];
  referenceImages.forEach((img) => {
    parts.push({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType || "image/png",
      },
    });
  });
  parts.push({ text: generationPrompt });

  // STEP 1: Draft
  const draftParts = [
    ...parts,
    { text: "Generate a fast, low-detail conceptual draft of: " + generationPrompt },
  ];
  const draftResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: { parts: draftParts },
  });

  let draftBase64 = "";
  if (draftResponse.candidates?.[0]?.content?.parts) {
    for (const part of draftResponse.candidates[0].content.parts) {
      if (part.inlineData) {
        draftBase64 = part.inlineData.data;
        break;
      }
    }
  }

  if (!draftBase64) {
    throw new Error("Failed to generate conceptual draft.");
  }

  // STEP 2: Final
  const finalParts = [
    { inlineData: { data: draftBase64, mimeType: "image/png" } },
    {
      text:
        "Use this draft image as the exact base composition. Enhance, refine, and render it in extremely high quality and detail based on this description: " +
        generationPrompt,
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents: { parts: finalParts },
  });

  let base64Data = "";
  let responseText = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Data = part.inlineData.data;
      } else if (part.text) {
        responseText = part.text;
      }
    }
  }

  if (!base64Data) {
    throw new Error("Failed to generate final image.");
  }

  const imageUrl = `data:image/png;base64,${base64Data}`;

  const pngMetadata: Record<string, string> = {
    Prompt: generationPrompt,
    Software: "Anime Fusion Generator",
    Version: (metadata as any).version || "0.7.0",
    Series: series.join(", "),
    Timestamp: new Date().toISOString(),
  };

  const finalImageUrl = injectMetadata(imageUrl, pngMetadata);

  return {
    id: Date.now().toString(),
    url: finalImageUrl,
    prompt: generationPrompt,
    metadata: responseText,
    timestamp: Date.now(),
  };
}

export async function refineImage(
  image: { url: string; prompt?: string; series?: string[] },
  refinePrompt?: string,
  apiKey?: string
): Promise<{ url: string; prompt: string; metadata?: string }> {
  const activeApiKey = getApiKey(apiKey);

  try {
    const res = await fetch("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, refinePrompt, apiKey: activeApiKey }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend /api/refine unavailable, using client-side fallback.", err);
  }

  if (!activeApiKey) throw new Error("Missing API Key.");

  const ai = new GoogleGenAI({ apiKey: activeApiKey });
  const [mimePart, data] = image.url.split(";base64,");
  const mimeType = mimePart ? mimePart.split(":")[1] : "image/png";

  const promptText = refinePrompt?.trim()
    ? `Refine and modify this image according to the following instruction: ${refinePrompt.trim()}. Keep the core artistic style and elements intact while applying the requested changes with high detail and quality.`
    : "Refine and enhance this image. Improve line quality, lighting, color depth, and overall detail while preserving the original artwork's composition and subject.";

  const refineParts = [
    { inlineData: { data, mimeType } },
    { text: promptText },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: refineParts },
  });

  let base64Data = "";
  let responseText = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Data = part.inlineData.data;
      } else if (part.text) {
        responseText = part.text;
      }
    }
  }

  if (!base64Data) throw new Error("No refined image data received.");

  const imageUrl = `data:image/png;base64,${base64Data}`;
  const newPrompt = image.prompt
    ? `${image.prompt} (Refined: ${refinePrompt?.trim() || "Enhanced"})`
    : (refinePrompt?.trim() || "Refined Image");

  const pngMetadata: Record<string, string> = {
    Prompt: newPrompt,
    Software: "Anime Fusion Generator",
    Version: (metadata as any).version || "0.7.0",
    Series: (image.series || []).join(", "),
    Timestamp: new Date().toISOString(),
  };

  const finalImageUrl = injectMetadata(imageUrl, pngMetadata);

  return {
    url: finalImageUrl,
    prompt: newPrompt,
    metadata: responseText,
  };
}

export async function upscaleImage(image: { url: string }, apiKey?: string): Promise<{ url: string }> {
  const activeApiKey = getApiKey(apiKey);

  try {
    const res = await fetch("/api/upscale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, apiKey: activeApiKey }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend /api/upscale unavailable, using client-side fallback.", err);
  }

  if (!activeApiKey) throw new Error("Missing API Key.");

  const ai = new GoogleGenAI({ apiKey: activeApiKey });
  const [mimePart, data] = image.url.split(";base64,");
  const mimeType = mimePart.split(":")[1];

  const upscaleParts = [
    { inlineData: { data, mimeType } },
    { text: "Upscale this image to high resolution, enhance details, sharp, masterpiece, 4k quality." },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: upscaleParts },
  });

  let base64Data = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      base64Data = part.inlineData.data;
      break;
    }
  }

  if (!base64Data) throw new Error("No upscaled image data received.");
  return { url: `data:image/png;base64,${base64Data}` };
}

export async function generateMusic(
  prompt: string,
  imageBase64: string,
  apiKey?: string
): Promise<{ audioBase64: string; audioMimeType: string }> {
  const activeApiKey = getApiKey(apiKey);

  try {
    const res = await fetch("/api/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, imageBase64, apiKey: activeApiKey }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend /api/music unavailable, using client-side fallback.", err);
  }

  if (!activeApiKey) throw new Error("Missing API Key.");

  const musicAi = new GoogleGenAI({ apiKey: activeApiKey });
  const musicResponse = await musicAi.models.generateContent({
    model: "lyria-3-clip-preview",
    contents: {
      parts: [
        { text: `Generate a 30-second anime opening style track inspired by this image and prompt: ${prompt}` },
        { inlineData: { data: imageBase64, mimeType: "image/png" } },
      ],
    },
  });

  let audioBase64 = "";
  let audioMimeType = "audio/wav";

  for (const part of musicResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      if (!audioBase64 && part.inlineData.mimeType) {
        audioMimeType = part.inlineData.mimeType;
      }
      audioBase64 += part.inlineData.data;
    }
  }

  if (!audioBase64) throw new Error("Failed to generate music.");
  return { audioBase64, audioMimeType };
}

export async function checkHealth(): Promise<{ status: string; version: string }> {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Ignore network error on static deployment
  }

  // On static hosting (GitHub Pages), return static status
  return { status: "ok", version: (metadata as any).version || "0.7.0" };
}
