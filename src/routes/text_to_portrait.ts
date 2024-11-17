import { Router, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";

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
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      const workflow = JSON.parse(workflowJson);

      const textPrompt = `${text}, close-up, portrait_(object), positive_face, looking_at_viewer, face_shot, front`;

      workflow["13"].inputs.text = textPrompt;

      console.log("Workflow:", workflow);

      const wrappedWorkflow = {
        prompt: workflow,
      };

      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const filepaths = await comfyuiService.getResult(promptId);

      console.log("Filepaths:", filepaths);

      if (filepaths.length !== 0) {
        const imagePath = filepaths[0];
        res.sendFile(imagePath);
      } else {
        res.status(500).json({ error: "未找到图片" });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "未知错误" });
      }
    }
  }
);

export default textToPortraitRouter;
