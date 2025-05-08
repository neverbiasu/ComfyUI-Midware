import { Router } from "express";
import styleTransferRouter from "./style_transfer";
import textToPortraitRouter from "./text_to_portrait";
import textToSceneRouter from "./text_to_scene";
import styleTransferWCnIpaLcmRouter from "./style_transfer_w_cn_ipa_lcm";
import ipadapterScribbleRouter from "./ipadapter_scribble";
import textGenRouter from "./text_gen";
import characterPortraitGenRouter from "./character_portrait_gen";
import plotGenRouter from "./plot_gen";
import plotImageGenRouter from "./plot_image_gen";
import characterPortraitAblationRouter from "./character_portrait_ablation";
import chatttsBasicRouter from "./chattts_basic";

const router = Router();

router.use("/style_transfer", styleTransferRouter);
router.use("/text_to_portrait", textToPortraitRouter);
router.use("/text_to_scene", textToSceneRouter);
router.use("/style_transfer_w_cn_ipa_lcm", styleTransferWCnIpaLcmRouter);
router.use("/ipadapter_scribble", ipadapterScribbleRouter);
router.use("/text_gen", textGenRouter);
router.use("/character_portrait_gen", characterPortraitGenRouter);
router.use("/plot_gen", plotGenRouter);
router.use("/plot_image_gen", plotImageGenRouter);
router.use("/character_portrait_ablation", characterPortraitAblationRouter);
router.use("/chattts_basic", chatttsBasicRouter);

export default router;
