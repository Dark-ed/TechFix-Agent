// server.js
import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend files (index.html, app.js, style.css)
app.use(express.static(path.join(__dirname, "../frontend")));

// TEST ROUTE
app.get("/api/test", (req, res) => {
  res.send("Backend is working!");
});

// Watson Assistant API route
app.post("/api/message", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      `${process.env.WATSON_ASSISTANT_URL}/v2/assistants/${process.env.WATSON_ASSISTANT_ID}/message`,
      { input: { text: message } },
      {
        headers: {
          "Authorization": `Bearer ${process.env.WATSON_ASSISTANT_APIKEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ reply: response.data.output.generic[0].text });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Assistant API error" });
  }
});

// Orchestrate API route (mock if no key)
app.post("/api/orchestrate/run", async (req, res) => {
  try {
    // If you have ORCHESTRATE keys, it will call real workflow
    const response = await axios.post(
      `${process.env.ORCHESTRATE_URL}/trigger`,
      {},
      {
        headers: {
          "Authorization": `Bearer ${process.env.ORCHESTRATE_APIKEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ result: response.data });
  } catch (error) {
    console.error(error.response?.data || error.message);
    // Mock response if no key
    res.json({ result: "Workflow triggered (mock)" });
  }
});

// For all other routes, serve index.html (frontend SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
