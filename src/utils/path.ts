import path from "path";

export const getImagePath = (filename: string): string => {
  const comfyuiDir = process.env.COMFYUI_DIR as string;
  if (!comfyuiDir) {
    throw new Error("COMFYUI_DIR 环境变量未设置");
  }
  return path.join(comfyuiDir, "input", filename);
};
