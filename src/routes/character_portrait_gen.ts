import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import comfyuiService from "../services/comfyuiService";
import dotenv from "dotenv";
import { sendImageResponse } from "../utils/send_image";
import { getImagePath } from "../utils/path";
import { randomSeed } from "../utils/random_seed";

dotenv.config();

const characterPortraitGenRouter = Router();

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

characterPortraitGenRouter.post(
  "/",
  upload,
  async (req: Request, res: Response): Promise<void> => {
    const requestTime = new Date();
    console.log(
      `[character_portrait_gen] 请求收到时间: ${requestTime.toISOString()}`
    );
    try {
      const { characterDescription, loraStyle } = req.body;

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

      // Copy uploaded file to ComfyUI input directory
      fs.copyFileSync(portraitImage.path, portraitImagePath);
      fs.unlinkSync(portraitImage.path);

      // Parse workflow and update nodes
      const workflow = JSON.parse(workflowJson);

      // Update character description (Node 15)
      workflow["15"].inputs.value = characterDescription;

      // Update portrait image (Node 12)
      workflow["12"].inputs.image = portraitImageName;

      // Update LoRA style if provided (Node 14)
      if (validatedLoraStyle) {
        workflow["14"].inputs.lora_name = validatedLoraStyle;
      }

      // Update seed for randomness
      workflow["9"].inputs.seed = parseInt(randomSeed());

      const wrappedWorkflow = {
        prompt: workflow,
      };

      const beforeRequestTime = new Date();
      console.log(
        `[character_portrait_gen] 请求ComfyUI时间: ${beforeRequestTime.toISOString()}`

)
      const promptId = await comfyuiService.executeWorkflow(wrappedWorkflow);
      const afterRequestTime = new Date();
      console.log(
        `[character_portrait_gen] ComfyUI返回ID: ${promptId} 时间: ${afterRequestTime.toISOString()}`
      );
      console.log(
        `[character_portrait_gen] ComfyUI请求耗时: ${
          (afterRequestTime.getTime() - beforeRequestTime.getTime()) / 1000
        }s`
      );
      let filepaths;
      let retries = 0;
      const maxRetries = 120;

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
        console.error("Failed to retrieve image paths:", filepaths);
        res.status(500).json({ error: "Failed to retrieve image paths" });
      }
      const responseTime = new Date();
      console.log(
        `[character_portrait_gen] 请求返回时间: ${responseTime.toISOString()}`
      );
      console.log(
        `[character_portrait_gen] 总耗时: ${
          (responseTime.getTime() - requestTime.getTime()) / 1000
        }s`
      );
    } catch (error) {
      console.error("Error generating character portrait:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Unknown error" });
      }
    }
  }
);

export default characterPortraitGenRouter;
