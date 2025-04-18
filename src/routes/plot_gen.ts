import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendTextResponse } from "../utils/send_text";

dotenv.config();

const plotGenRouter = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
}).none();

const workflowJson = fs.readFileSync("./src/assets/plot_gen.json", "utf-8");

plotGenRouter.post(
  "/",
  upload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      const workflow = JSON.parse(workflowJson);

      // Update the input value in node 1
      workflow["1"].inputs.value = prompt;

      const wrappedWorkflow = {
        prompt: workflow,
      };
      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      // Wait for the generation to complete
      let retries = 0;
      const maxRetries = 30;
      let textResult;

      while (!textResult && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          textResult = await comfyuiService.getTextResult(promptId);
        } catch (error) {
          console.error("Error fetching result:", error);
          retries++;
        }
      }

      if (textResult) {
        sendTextResponse(res, textResult);
      } else {
        res.status(500).json({ error: "Failed to retrieve generated text" });
      }
    } catch (error) {
      console.error("Error generating plot:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Unknown error" });
      }
    }
  }
);

export default plotGenRouter;
