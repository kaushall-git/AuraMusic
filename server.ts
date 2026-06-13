import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body Parsing limits
  app.use(express.json({ limit: "50mb" }));

  // Initialize GenAI client
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Please add it to Secrets setting.");
  }
  const ai = new GoogleGenAI({
    apiKey: apiKey || "placeholder_api_key",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Curated Recommendations
  app.post("/api/recommendations", async (req, res) => {
    const { prompt, availableTracks } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert music curator for "Aura Music". Given this user mood description/prompt: "${prompt}", select the most appropriate songs from these available options: ${JSON.stringify(availableTracks)}. Return an elegant playlistTitle, matching mood description, and list of recommendedTrackIds in JSON format. Provide 2 to 6 tracks.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["playlistTitle", "description", "recommendedTrackIds"],
            properties: {
              playlistTitle: { type: Type.STRING },
              description: { type: Type.STRING },
              recommendedTrackIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      console.error("Recommendations error:", err);
      res.status(500).json({ error: err.message || "Failed to get recommendations" });
    }
  });

  // Speech to Text Microphone Audio Transcription
  app.post("/api/transcribe", async (req, res) => {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Audio data is required" });
    }
    try {
      let cleanBase64 = audioData;
      if (audioData.includes(";base64,")) {
        cleanBase64 = audioData.split(";base64,")[1];
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "audio/webm"
            }
          },
          {
            text: "Listen to the recorded voice from the microphone. Transcribe it into English text accurately. Output ONLY the transcription itself. No introduction, conversational wrapper, preamble, or notes."
          }
        ]
      });
      res.json({ text: response.text?.trim() || "" });
    } catch (err: any) {
      console.error("Transcribe error:", err);
      res.status(500).json({ error: err.message || "Failed to transcribe audio" });
    }
  });

  // Lyria AI Music Generator
  app.post("/api/generate-music", async (req, res) => {
    const { prompt, version } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const model = version === "pro" ? "lyria-3-pro-preview" : "lyria-3-clip-preview";
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (!audioBase64) {
        throw new Error("No music audio bytes returned from Gemini Lyria model.");
      }

      res.json({
        audio: audioBase64,
        lyrics,
        mimeType,
        title: `AI Track: ${prompt.slice(0, 24)}`,
        artist: "Aura Lyria AI Creator"
      });
    } catch (err: any) {
      console.error("Music generation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate music" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
