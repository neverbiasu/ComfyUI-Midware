import { Router, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendImageResponse } from "../utils/send_image";

dotenv.config();

const textToPortraitRouter = Router();
const upload = multer();

const workflowJson = fs.readFileSync(
  "./src/assets/text_to_portrait.json",
  "utf-8"
);

textToPortraitRouter.post(
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

      const textPrompt = `${text}, close-up, portrait_(object), positive_face, looking_at_viewer, face_shot, front`;

      workflow["13"].inputs.text = textPrompt;

      const wrappedWorkflow = {
        prompt: workflow,
      };

      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const filepaths = await comfyuiService.getResult(promptId);

      sendImageResponse(res, filepaths);
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

export default textToPortraitRouter;
