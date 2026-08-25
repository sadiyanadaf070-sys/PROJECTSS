import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Analysis Route
app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const { jobRole, skills } = req.body;

    const prompt = `
    Candidate Skills: ${skills}
    Target Job Role: ${jobRole}

    Analyze and return:
    1. Missing Skills
    2. Resume Gaps
    3. Suggested Projects
    4. Learning Roadmap
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ result: response.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error analyzing data");
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));