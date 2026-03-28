import crypto from "crypto";

export default async function handler(req, res) {

  // 🔥 IMMER setzen
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ PRE-FLIGHT MUSS IMMER funktionieren
  if (req.method === "OPTIONS") {
    return res.status(200).json({ ok: true });
  }

  // ❌ alles außer POST blocken
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;

if (typeof body === "string") {
  body = JSON.parse(body);
}

const { prompt } = body || {};

    console.log("BODY:", body);
console.log("PROMPT:", prompt);

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const ACCESS_KEY = process.env.KLING_ACCESS_KEY;
    const SECRET_KEY = process.env.KLING_SECRET_KEY;

    if (!ACCESS_KEY || !SECRET_KEY) {
      return res.status(500).json({ error: "Missing API keys" });
    }

    const response = await fetch("https://api.klingai.com/v1/videos/image-to-video", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ACCESS_KEY}`,
  },
  body: JSON.stringify({
    model: "kling-v1",
    mode: "image-to-video",
    prompt: prompt,
    image: body.imageUrl,
    duration: body.duration || 3
  }),
});

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Kling API error",
        details: data,
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("BACKEND ERROR:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
