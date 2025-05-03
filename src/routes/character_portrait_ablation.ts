import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendImageResponse } from "../utils/send_image";
import { getImagePath } from "../utils/path";
import { randomSeed } from "../utils/random_seed";

dotenv.config();

const characterPortraitAblationRouter = Router();

const upload = multer({ dest: "uploads/" }).fields([
  { name: "portrait", maxCount: 1 },
]);

const workflowJson = fs.readFileSync(
  "./src/assets/character_portrait_gen.json",
  "utf-8"
);

const SUPPORTED_LORA_STYLES = [
  "DarkestDungeonSDXL",
  "J_cartoon",
  "Duolinguo_flat_syle_XL",
  "Lego_XL_v2.1",
  "pixel-art-xl-v1.1",
];

characterPortraitAblationRouter.post(
  "/",
  upload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        characterDescription,
        loraStyle,
        sampler,
        scheduler,
        unet,
        cfg_zero_star,
      } = req.body;

      if (!characterDescription) {
        res.status(400).json({ error: "Character description is required" });
        return;
      }

      let validatedLoraStyle = undefined;
      if (loraStyle) {
        const cleanStyle = loraStyle.replace(/\.safetensors$/, "");
        if (!SUPPORTED_LORA_STYLES.includes(cleanStyle)) {
          res.status(400).json({
            error: "Unsupported LoRA style",
            supportedStyles: SUPPORTED_LORA_STYLES,
          });
          return;
        }
        validatedLoraStyle = `${cleanStyle}.safetensors`;
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files || !files["portrait"]) {
        res.status(400).json({ error: "Portrait image is required" });
        return;
      }

      const portraitImage = files["portrait"][0];
      const portraitImagePath = getImagePath(portraitImage.originalname);
      const portraitImageName = portraitImage.originalname;

      // 拷贝上传文件到ComfyUI输入目录
      fs.copyFileSync(portraitImage.path, portraitImagePath);
      fs.unlinkSync(portraitImage.path);

      // 解析工作流并注入参数
      const workflow = JSON.parse(workflowJson);

      // 角色描述
      workflow["15"].inputs.value = characterDescription;
      // 人脸图片
      workflow["12"].inputs.image = portraitImageName;
      // 兼容部分节点需要image输入
      if (workflow["12"].inputs) {
        workflow["12"].inputs.image = portraitImageName;
      }
      // LoRA风格
      if (validatedLoraStyle) {
        workflow["14"].inputs.lora_name = validatedLoraStyle;
      }
      // 随机种子
      workflow["9"].inputs.seed = parseInt(randomSeed());

      // Ablation参数注入
      if (sampler) {
        workflow["9"].inputs.sampler_name = sampler;
      }
      if (scheduler) {
        workflow["9"].inputs.scheduler = scheduler;
      }
      if (unet) {
        workflow["10"].inputs.unet_name = unet;
      }
      // CFG-Zero-Star消融控制（如需关闭，跳过20节点）
      if (cfg_zero_star === "off" || cfg_zero_star === false) {
        // 直接将FreeU的model输入指向Pulid Apply输出（跳过CFGZeroStar）
        workflow["28"].inputs.model = ["8", 0];
      } // 否则默认走20节点（CFGZeroStar）

      const wrappedWorkflow = {
        prompt: workflow,
      };

      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);

      let filepaths;
      let retries = 0;
      const maxRetries = 100;

      while (!filepaths && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          filepaths = await comfyuiService.getImageResult(promptId);
        } catch (error) {
          retries++;
        }
      }

      if (filepaths) {
        sendImageResponse(res, filepaths);
      } else {
        res.status(500).json({ error: "Failed to retrieve image paths" });
      }
    } catch (error) {
      console.error("Error generating character portrait (ablation):", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Unknown error" });
      }
    }
  }
);

export default characterPortraitAblationRouter;
