import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";

dotenv.config();

const styleTransferRouter = Router();

const upload = multer({ dest: "uploads/" }).fields([
  { name: "content", maxCount: 1 },
  { name: "style", maxCount: 1 },
]);

const workflowJson = fs.readFileSync(
  "./src/assets/style_transfer.json",
  "utf-8"
);

const getImagePath = (filename: string) => {
  const comfyuiDir = process.env.COMFYUI_DIR as string; // 从环境变量获取 ComfyUI 目录
  if (!comfyuiDir) {
    throw new Error("COMFYUI_DIR 环境变量未设置");
  }
  return path.join(comfyuiDir, "input", filename);
};

styleTransferRouter.post("/", upload, async (req: Request, res: Response) => {
  try {
    const { positivePrompt, negativePrompt } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || !files["style"] || !files["content"]) {
      res.status(400).json({ error: "缺少必要的文件" });
      return;
    }

    const styleImage = files["style"][0];
    const contentImage = files["content"][0];

    // 添加日志以调试文件对象
    console.log("Style Image:", styleImage.originalname);
    console.log("Content Image:", contentImage.originalname);

    const styleImagePath = getImagePath(styleImage.filename);
    const contentImagePath = getImagePath(contentImage.filename);

    fs.copyFileSync(styleImage.path, styleImagePath);
    fs.unlinkSync(styleImage.path);
    fs.copyFileSync(contentImage.path, contentImagePath);
    fs.unlinkSync(contentImage.path);

    const workflow = JSON.parse(workflowJson);

    workflow["15"].inputs.text = positivePrompt;
    workflow["16"].inputs.text = negativePrompt;

    workflow["1"].inputs.file = styleImagePath;
    workflow["2"].inputs.file = contentImagePath;

    const wrappedWorkflow = {
      prompt: workflow,
    };

    const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

    res.json({ promptId });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "未知错误" });
    }
  }
});

export default styleTransferRouter;
