import { useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import PREDEFINED_SERIES from '../series/series.json';
import { handleFirestoreError, OperationType } from '../utils/firestore-error';
import { compressImageForFirestore } from '../generator/utils/image-processing';

const PROMPT_TEMPLATES = [
  "Epic battle scene with dynamic lighting",
  "Peaceful slice of life moment",
  "Cyberpunk city background",
  "Fantasy RPG character portrait",
  "Dramatic sunset silhouette",
  "Action pose with magical effects",
  "Chibi style cute interaction",
  "Dark and moody atmosphere"
];

export function useAutoDream() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAndRun = async () => {
      const isEnabled = localStorage.getItem('auto_dream_enabled') === 'true';
      if (!isEnabled) return;

      const lastRun = localStorage.getItem('auto_dream_last_run');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (!lastRun || now - parseInt(lastRun) >= oneHour) {
        if (navigator.locks) {
          await navigator.locks.request('auto-dream-lock', { mode: 'exclusive', ifAvailable: true }, async (lock) => {
            if (!lock) {
              console.log("AutoDream: Another tab is currently generating.");
              return;
            }
            await generateAutoDream();
            localStorage.setItem('auto_dream_last_run', now.toString());
          });
        } else {
          await generateAutoDream();
          localStorage.setItem('auto_dream_last_run', now.toString());
        }
      }
    };

    // Check immediately on mount
    checkAndRun();

    // Then check every minute
    intervalRef.current = setInterval(checkAndRun, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}

async function generateAutoDream() {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("AutoDream: No API key available.");
    return;
  }

  try {
    console.log("AutoDream: Generating new dream...");
    const ai = new GoogleGenAI({ apiKey });

    // Pick 2 random series
    const shuffledSeries = [...PREDEFINED_SERIES].sort(() => 0.5 - Math.random());
    const selectedSeries = [shuffledSeries[0].name, shuffledSeries[1].name];
    
    // Pick a random prompt template
    const template = PROMPT_TEMPLATES[Math.floor(Math.random() * PROMPT_TEMPLATES.length)];

    const fullPrompt = `Anime style fusion of ${selectedSeries.join(" and ")}. ${template}. High quality, detailed anime art.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: fullPrompt,
    });

    let base64Data = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Data = part.inlineData.data;
        break;
      }
    }

    if (!base64Data) throw new Error("No image data received.");

    const rawImageUrl = `data:image/png;base64,${base64Data}`;
    const compressedImageUrl = await compressImageForFirestore(rawImageUrl);

    // Save to Firestore
    try {
      await addDoc(collection(db, 'fusions'), {
        prompt: fullPrompt,
        series: selectedSeries,
        imageUrl: compressedImageUrl,
        createdAt: serverTimestamp(),
        authorId: auth.currentUser?.uid || 'auto-dreamer',
        isAutoDream: true
      });
    } catch (error) {
      console.error("Failed to save AutoDream to Firestore:", error);
    }

    console.log("AutoDream: Successfully generated and saved a new dream.");
  } catch (err) {
    console.error("AutoDream Error:", err);
  }
}
