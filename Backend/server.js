import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = 4000;
const ESP32_IP = "http://10.207.138.172";
const ESP32_SOUND_IP = "http://10.207.138.223";

app.use(cors());
app.use(express.json());

app.get("/api/sound-data", async (_req, res) => {
  console.log("\n=== Fetching Sound Data ===");
  try {
    const response = await fetch(`${ESP32_SOUND_IP}/data`);
    if (!response.ok) {
      throw new Error(`ESP32 responded with status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Sound Data:", data);
    res.json(data);
  } catch (err) {
    console.error("Error fetching from ESP32:", err.message);
    res.status(500).json({ 
      error: "Failed to fetch ESP32 data",
      details: err.message 
    });
  }
});


app.post("/api/relay", async (req, res) => {
  try {
    const response = await fetch(`${ESP32_IP}/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
