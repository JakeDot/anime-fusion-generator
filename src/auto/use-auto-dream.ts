import { useEffect, useRef } from 'react';
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

  try {
    console.log("AutoDream: Generating new dream...");

    // Pick 2 random series
    const shuffledSeries = [...PREDEFINED_SERIES].sort(() => 0.5 - Math.random());
    const selectedSeriesNames = [shuffledSeries[0].id, shuffledSeries[1].id];
    
    // Pick a random prompt template
    const template = PROMPT_TEMPLATES[Math.floor(Math.random() * PROMPT_TEMPLATES.length)];

    const res = await fetch('/api/generate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        series: selectedSeriesNames,
        prompt: template,
        apiKey: apiKey || ""
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to generate image.");
    }

    const { url: rawImageUrl, prompt: fullPrompt } = await res.json();
    const compressedImageUrl = await compressImageForFirestore(rawImageUrl);

    // Save to Firestore
    try {
      await addDoc(collection(db, 'fusions'), {
        prompt: fullPrompt,
        series: selectedSeriesNames,
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
