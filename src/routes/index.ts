import { Router } from "express";
import styleTransferRouter from "./style_transfer";
import textToPortraitRouter from "./text_to_portrait";

const router = Router();

router.use("/style_transfer", styleTransferRouter);
router.use("/text_to_portrait", textToPortraitRouter);

export default router;
