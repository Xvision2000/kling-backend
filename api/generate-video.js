import crypto from "crypto";

export default async function handler(req, res) {

  // 🔥 ULTRA WICHTIG – IMMER ALS ERSTES
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ PRE-FLIGHT REQUEST RICHTIG BEANTWORTEN
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ ALLES ANDERE BLOCKEN
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

    const ACCESS_KEY = process.env.KLING_ACCESS_KEY;
    const SECRET_KEY = process.env.KLING_SECRET_KEY;

    if (!ACCESS_KEY || !SECRET_KEY) {
      return res.status(500).json({ error: "Missing API keys" });
    }

    const timestamp = Date.now().toString();
    const payload = JSON.stringify({ prompt });

    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(timestamp + payload)
      .digest("hex");

    const response = await fetch("https://api.kling.ai/v1/video/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Key": ACCESS_KEY,
        "Timestamp": timestamp,
        "Signature": signature,
      },
      body: payload,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Kling API error",
        details: data,
      });
    }

    const jobId = data?.job_id;

    if (!jobId) {
      return res.status(500).json({
        error: "No job_id returned",
        data,
      });
    }

    let videoUrl = null;

    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const statusRes = await fetch(
        `https://api.kling.ai/v1/video/status/${jobId}`,
        {
          headers: {
            "Access-Key": ACCESS_KEY,
          },
        }
      );

      const statusData = await statusRes.json();

      if (statusData.status === "completed") {
        videoUrl = statusData.video_url;
        break;
      }
    }

    if (!videoUrl) {
      return res.status(500).json({
        error: "Video generation timeout",
      });
    }

    return res.status(200).json({ videoUrl });

  } catch (error) {
    console.error("BACKEND ERROR:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
