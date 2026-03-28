module.exports = async function handler(req, res) {

  try {
    // ✅ CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(200).json({ status: "API running" });
    }

    // ✅ Body safe
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const prompt = body?.prompt;
    const imageUrl = body?.imageUrl;

    if (!prompt || !imageUrl) {
      return res.status(400).json({
        error: "Missing prompt or imageUrl"
      });
    }

    const FAL_KEY = process.env.FAL_KEY;

    if (!FAL_KEY) {
      return res.status(500).json({
        error: "Missing FAL_KEY"
      });
    }

    // 🎬 ASYNC fal.ai CALL
    const falResponse = await fetch(
      "https://queue.fal.run/fal-ai/minimax/video-01/image-to-video",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Key ${FAL_KEY}`,
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

    const data = await falResponse.json();

    if (!falResponse.ok) {
      console.error("FAL ERROR:", data);

      return res.status(500).json({
        error: "fal.ai error",
        details: data
      });
    }

    // ✅ taskId zurückgeben (WICHTIG!)
    const taskId = data?.request_id || data?.id;

if (!taskId) {
  console.error("FAL RESPONSE:", data);

  return res.status(500).json({
    error: "No taskId from fal",
    details: data
  });
}

return res.status(200).json({
  taskId: taskId
});
    });

  } catch (err) {
    console.error("CRASH:", err);

    return res.status(500).json({
      error: "Server crashed",
      message: err.message
    });
  }
}
