import { Router } from "express";
import styleTransferRouter from "./style_transfer";
import textToPortraitRouter from "./text_to_portrait";
import textToSceneRouter from "./text_to_scene";
import styleTransferWCnIpaLcmRouter from "./style_transfer_w_cn_ipa_lcm";

const router = Router();

router.use("/style_transfer", styleTransferRouter);
router.use("/text_to_portrait", textToPortraitRouter);
router.use("/text_to_scene", textToSceneRouter);
router.use("/style_transfer_w_cn_ipa_lcm", styleTransferWCnIpaLcmRouter);

export default router;
