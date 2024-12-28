import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendImageResponse } from "../utils/send_image";

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

const getImagePath = (filename: string) => {
  const comfyuiDir = process.env.COMFYUI_DIR as string;
  if (!comfyuiDir) {
    throw new Error("COMFYUI_DIR 环境变量未设置");
  }
  return path.join(comfyuiDir, "input", filename);
};

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

      const styleImagePath = getImagePath(styleImage.filename);
      const contentImagePath = getImagePath(contentImage.filename);

      fs.copyFileSync(styleImage.path, styleImagePath);
      fs.unlinkSync(styleImage.path);
      fs.copyFileSync(contentImage.path, contentImagePath);
      fs.unlinkSync(contentImage.path);

      const workflow = JSON.parse(workflowJson);

      workflow["1"].inputs.file = contentImagePath;
      workflow["15"].inputs.file = styleImagePath;

      const wrappedWorkflow = {
        prompt: workflow,
      };

      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      await new Promise((resolve) => setTimeout(resolve, 20000));

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