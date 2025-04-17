import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendImageResponse } from "../utils/send_image";
import { getImagePath } from "../utils/path";

dotenv.config();

const ipadapterScribbleRouter = Router();

const upload = multer({ dest: "uploads/" }).fields([
  { name: "style", maxCount: 1 },
  { name: "content", maxCount: 1 },
]);

const workflowJson = fs.readFileSync(
  "./src/assets/ipadapter_scribble.json",
  "utf-8"
);

ipadapterScribbleRouter.post(
  "/",
  upload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files || !files["style"] || !files["content"]) {
        res
          .status(400)
          .json({ error: "Style and content images are required" });
        return;
      }

      const styleImage = files["style"][0];
      const contentImage = files["content"][0];

      const styleImagePath = getImagePath(styleImage.originalname);
      const contentImagePath = getImagePath(contentImage.originalname);

      const contentImageName = contentImage.originalname;
      const styleImageName = styleImage.originalname;

      fs.copyFileSync(styleImage.path, styleImagePath);
      fs.unlinkSync(styleImage.path);
      fs.copyFileSync(contentImage.path, contentImagePath);
      fs.unlinkSync(contentImage.path);

      const workflow = JSON.parse(workflowJson);

      workflow["26"].inputs.image = contentImageName;
      workflow["25"].inputs.image = styleImageName;

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
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default ipadapterScribbleRouter;
