import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { buildGenerationPrompt } from "./src/generator/utils/prompt-builder";
import { injectMetadata } from "./src/generator/utils/png-metadata";
import metadata from "./metadata.json";

const API_KEY = process.env.GEMINI_API_KEY || "";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));

  // API Routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", version: (metadata as any).version });
  });

  /**
   * @api {post} /api/generate Generate Anime Fusion Image
   * @apiDescription Generates an anime style fusion image based on selected series and custom prompts.
   */
  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      const {
        series = [],
        prompt = "",
        negativePrompt = "",
        promptPrefix = "",
        referenceImages = [],
        transparentBackground = false,
        model = "gemini-2.0-flash-exp",
        apiKey = ""
      } = req.body;

      const activeApiKey = apiKey || API_KEY;
      if (!activeApiKey) {
        return res.status(401).json({ error: "Missing API Key. Provide it in the request body or set GEMINI_API_KEY env var." });
      }

      const ai = new GoogleGenAI({ apiKey: activeApiKey });
      
      const generationPrompt = buildGenerationPrompt({
        selectedSeries: series,
        customPrompt: prompt,
        negativePrompt: negativePrompt,
        promptPrefix: promptPrefix,
        transparentBackground,
        hasReferenceImages: referenceImages.length > 0
      });

      const parts: any[] = [];
      referenceImages.forEach((img: any) => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType || "image/png"
          }
        });
      });
      parts.push({ text: generationPrompt });

      // In the API, we'll go straight to final generation for simplicity, or we could do the draft step.
      // Let's do the draft step to match the UI behavior and quality.
      
      // STEP 1: Draft
      const draftParts = [...parts, { text: "Generate a fast, low-detail conceptual draft of: " + generationPrompt }];
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
        { text: "Use this draft image as the exact base composition. Enhance, refine, and render it in extremely high quality and detail based on this description: " + generationPrompt }
      ];

      const response = await ai.models.generateContent({
        model: model,
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
      
      // Inject metadata
      const pngMetadata: Record<string, string> = {
        'Prompt': generationPrompt,
        'Software': 'Anime Fusion Generator API',
        'Version': (metadata as any).version || '0.5',
        'Series': series.join(', '),
        'Timestamp': new Date().toISOString()
      };

      const finalImageUrl = injectMetadata(imageUrl, pngMetadata);

      res.json({
        id: Date.now().toString(),
        url: finalImageUrl,
        prompt: generationPrompt,
        metadata: responseText,
        timestamp: Date.now()
      });

    } catch (err: any) {
      console.error("API Generation error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
