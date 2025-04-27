import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendTextResponse } from "../utils/send_text";

dotenv.config();

const textGenRouter = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
}).none();

const workflowJson = fs.readFileSync(
  "./src/assets/ollama_qwen_14b_instruct.json",
  "utf-8"
);

textGenRouter.post(
  "/",
  upload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userPrompt, systemPrompt } = req.body;

      console.log("body", req.body);
      console.log("userPrompt", userPrompt);
      console.log("systemPrompt", systemPrompt);

      if (!userPrompt || !systemPrompt) {
        res.status(400).json({ error: "Text is required" });
        return;
      }

      const workflow = JSON.parse(workflowJson);

      workflow["1"].inputs.value = userPrompt;
      workflow["3"].inputs.value = systemPrompt;

      const wrappedWorkflow = {
        prompt: workflow,
      };
      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      let retries = 0;
      const maxRetries = 100;
      let textResult;

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
