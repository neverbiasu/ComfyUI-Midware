import { Router, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendImageResponse } from "../utils/send_image";

dotenv.config();

const textToSceneRouter = Router();
const upload = multer();

const workflowJson = fs.readFileSync(
  "./src/assets/text_to_scene.json",
  "utf-8"
);

textToSceneRouter.post(
  "/",
  upload.none(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: "Text is required" });
        return;
      }

      const workflow = JSON.parse(workflowJson);

      const textPrompt = `${text}`;

      workflow["20"].inputs.text = textPrompt;

      const wrappedWorkflow = {
        prompt: workflow,
      };
      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);
      let filepaths;
      let retries = 0;
      const maxRetries = 30;

      while (!filepaths && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          filepaths = await comfyuiService.getImageResult(promptId);
        } catch (error) {
          console.error("Error fetching result:", error);
          retries++;
        }
      }

      if (filepaths) {
        sendImageResponse(res, filepaths);
      } else {
        res.status(500).json({ error: "Failed to retrieve image paths" });
      }
    } catch (error) {
      console.error("Error generating portrait:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "未知错误" });
      }
    }
  }
);

export default textToSceneRouter;
