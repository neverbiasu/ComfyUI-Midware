import { Router } from "express";
import styleTransferRouter from "./style_transfer";

const router = Router();

router.use("/style_transfer", styleTransferRouter);

export default router;
