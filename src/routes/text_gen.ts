import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendTextResponse } from "../utils/send_text";

dotenv.config();

let currentPlayerId = "-1";
const textGenRouter = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
}).none();

const workflowJson = fs.readFileSync("./src/assets/ollama.json", "utf-8");

textGenRouter.post(
  "/",
  upload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userPrompt, systemPrompt, playerId } = req.body;

      if (!userPrompt || !systemPrompt) {
        res.status(400).json({ error: "Text is required" });
        return;
      }

      const workflow = JSON.parse(workflowJson);

      workflow["1"].inputs.value = userPrompt;
      workflow["3"].inputs.value = systemPrompt;

      if (playerId !== currentPlayerId) {
        delete workflow["7"];
        delete workflow["2"].inputs.context;
        currentPlayerId = playerId;
        console.log("New playerId detected, removing node 7 from workflow.");
      }

      const wrappedWorkflow = {
        prompt: workflow,
      };
      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      let retries = 0;
      const maxRetries = 120;
      let textResult: string | null = null;

      while (!textResult && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          textResult = await comfyuiService.getTextResult(promptId);
        } catch (error) {
          retries++;
        }
      }

      if (textResult) {
        sendTextResponse(res, textResult);
      } else {
        res.status(500).json({ error: "Failed to retrieve generated text" });
      }
    } catch (error) {
      console.error("Error generating text:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default textGenRouter;
