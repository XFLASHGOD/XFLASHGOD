import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health & Status endpoint
app.get("/api/status", (_req, res) => {
  res.json({
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.8-flash",
    timestamp: new Date().toISOString(),
  });
});

// Gemini Chat Completion endpoint
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, systemInstruction, temperature = 0.7, model = "gemini-3.8-flash" } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing or invalid messages array" });
  }

  // Allow gemini-3.8-flash and gemini-3.1-flash-lite
  const allowedModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
  const targetModel = allowedModels.includes(model) ? model : "gemini-3.8-flash";

  // Format messages for @google/genai
  const formattedContents = messages.map((m: { role: string; content: string }) => {
    const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
    return {
      role,
      parts: [{ text: m.content }],
    };
  });

  const parsedTemp = typeof temperature === "number" ? Math.min(Math.max(temperature, 0), 2) : 0.7;

  if (!ai) {
    return res.status(503).json({
      error: "GEMINI_API_KEY not configured on server",
      simulated: true,
    });
  }

  try {
    const startTime = Date.now();
    const config: any = {
      systemInstruction: systemInstruction || "You are a friendly, concise AI tutor explaining technology concepts simply.",
      temperature: parsedTemp,
    };

    if (targetModel === "gemini-3.8-flash") {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.LOW,
      };
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: formattedContents,
      config,
    });

    const elapsedMs = Date.now() - startTime;
    const responseText = response.text || "";
    const usageMetadata = response.usageMetadata || null;

    return res.json({
      text: responseText,
      usage: usageMetadata,
      elapsedMs,
      model: targetModel,
      contentsPayload: formattedContents,
      systemInstruction: systemInstruction || undefined,
    });
  } catch (error: any) {
    console.error("Gemini API generation error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate content from Gemini API",
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
