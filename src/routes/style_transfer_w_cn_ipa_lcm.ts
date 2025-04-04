import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendImageResponse } from "../utils/send_image";
import { getImagePath } from "../utils/path";

dotenv.config();

const styleTransferWCnIpaLcmRouter = Router();

const upload = multer({ dest: "uploads/" }).fields([
  { name: "content", maxCount: 1 },
  { name: "style", maxCount: 1 },
]);

const workflowJson = fs.readFileSync(
  "./src/assets/style_transfer_w_cn_ipa_lcm.json",
  "utf-8"
);

styleTransferWCnIpaLcmRouter.post(
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

      workflow["1"].inputs.image = contentImageName;
      workflow["15"].inputs.image = styleImageName;

      const wrappedWorkflow = {
        prompt: workflow,
      };

      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      await new Promise((resolve) => setTimeout(resolve, 30000));

      const filepaths = await comfyuiService.getResult(promptId);

      sendImageResponse(res, filepaths);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Unknown error" });
      }
    }
  }
);

export default styleTransferWCnIpaLcmRouter;
