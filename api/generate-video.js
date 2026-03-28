export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {

  // ✅ CORS (wichtig für Base44)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Body sauber parsen (Base44 kompatibel)
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { prompt, imageUrl, duration } = body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const FAL_KEY = process.env.FAL_KEY;

    if (!FAL_KEY) {
      return res.status(500).json({ error: "Missing FAL_KEY" });
    }

    // 🎬 fal.ai Request
    const response = await fetch(
  "https://queue.fal.run/fal-ai/minimax/video-01/image-to-video",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Key ${process.env.FAL_KEY}`,
    },
    body: JSON.stringify({
      prompt: prompt + ", cinematic animation, smooth motion, no static frames",
      image_url: imageUrl,
      num_frames: 49,
      fps: 8,
      aspect_ratio: "9:16"
    }),
  }
);
      }
    );

    let data;
    let text;

    try {
      text = await response.text();
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    const data = await response.json();

if (!response.ok) {
  return res.status(500).json({
    error: "fal.ai error",
    details: data
  });
}

return res.status(200).json({
  taskId: data.request_id
});

    // ✅ Video URL extrahieren (fal Struktur)
    const videoUrl =
      data?.video?.url ||
      data?.url ||
      data?.output?.video?.url ||
      null;

    if (!videoUrl) {
      return res.status(500).json({
        error: "No video URL returned",
        data
      });
    }

    return res.status(200).json({
  taskId: data.request_id || data.id || "fallback-id",
  status: "processing",
  raw: data
});

  } catch (error) {
    console.error("BACKEND ERROR:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}
