import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const chatttBasicRouter = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
}).none();

const workflowJson = fs.readFileSync(
  "./src/assets/chattts_basic.json",
  "utf-8"
);

chatttBasicRouter.post(
  "/",
  upload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: "Text input is required" });
        return;
      }

      const workflow = JSON.parse(workflowJson);

      workflow["2"].inputs.text = text;

      const wrappedWorkflow = { prompt: workflow };
      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      let retries = 0;
      const maxRetries = 120;
      let audioFilePaths: string[] | null = null;

      console.log("Waiting for audio generation...");
      while (!audioFilePaths && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          audioFilePaths = await comfyuiService.getAudioResult(promptId);
          if (retries % 10 === 0) {
            console.log(`Still waiting... (${retries}s)`);
          }
        } catch (error) {}
        retries++;
      }

      if (audioFilePaths && audioFilePaths.length > 0) {
        const audioFilePath = audioFilePaths[0];
        console.log(`Audio generated: ${audioFilePath}`);

        if (!fs.existsSync(audioFilePath)) {
          res.status(500).json({ error: "Generated audio file not found" });
          return;
        }

        const fileName = path.basename(audioFilePath);
        const fileExtension =
          path.extname(audioFilePath).substring(1) || "flac";

        const contentType =
          fileExtension === "flac"
            ? "audio/flac"
            : fileExtension === "mp3"
            ? "audio/mpeg"
            : fileExtension === "wav"
            ? "audio/wav"
            : "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );

        const fileStream = fs.createReadStream(audioFilePath);
        fileStream.pipe(res);
      } else {
        console.error("Failed to generate audio after multiple attempts");
        res.status(500).json({
          error: "Audio generation timeout",
          prompt_id: promptId,
        });
      }
    } catch (error) {
      console.error("Error generating TTS audio:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Unknown error" });
      }
    }
  }
);

export default chatttBasicRouter;
