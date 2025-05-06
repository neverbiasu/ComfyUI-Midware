import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import FormData from "form-data";

dotenv.config();
const baseUrls = ["http://localhost:8188"];

class ComfyUIService {
  private baseUrl: string;
  private comfyUIDir: string;

  constructor() {
    this.baseUrl = baseUrls[0];
    this.comfyUIDir = process.env.COMFYUI_DIR as string;
  }

  /**
   * 上传图片到ComfyUI指定目录
   * @param localPath 本地图片文件路径
   * @param filename  上传到目标目录的文件名
   * @param options   目录和覆盖等参数
   * @returns         上传后的文件名和路径（可能被重命名）
   */
  async uploadImage(
    localPath: string,
    filename: string,
    options?: {
      type?: "input" | "output" | "temp";
      subfolder?: string;
      overwrite?: boolean;
    }
  ): Promise<{ filename: string; filepath: string }> {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(localPath), filename);
    if (options?.type) formData.append("type", options.type);
    if (options?.subfolder) formData.append("subfolder", options.subfolder);
    if (options?.overwrite)
      formData.append("overwrite", options.overwrite ? "true" : "false");

    try {
      const response = await axios.post(
        `${this.baseUrl}/upload/image`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Image upload failed");
    }
  }

  async executeWorkflow(workflowJson: object): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/prompt`,
        workflowJson
      );
      return response.data.prompt_id;
    } catch (error) {
      console.error("Error executing workflow:", error);
      throw new Error("Workflow execution failed");
    }
  }

  async getImageResult(promptId: string): Promise<string[] | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/history/${promptId}`
      );

      if (!response.data || !response.data[promptId]) {
        return null;
      }

      const data = response.data[promptId];

      if (!data.outputs || typeof data.outputs !== "object") {
        return null;
      }

      const filepaths: string[] = [];

      // 遍历outputs查找图像
      Object.keys(data.outputs).forEach((key) => {
        const output = data.outputs[key];
        if (output.images && Array.isArray(output.images)) {
          output.images.forEach((image: any) => {
            const filename = image.filename;
            const folder = image.type;
            filepaths.push(`${this.comfyUIDir}/${folder}/${filename}`);
          });
        }
      });

      // 如果找到了图像，返回路径数组；否则返回null
      return filepaths.length > 0 ? filepaths : null;
    } catch (error) {
      // 只记录非404错误，因为404可能只是表示结果尚未生成
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        console.error("Error fetching result:", error.message);
      }
      // 返回null而不是抛出错误
      return null;
    }
  }

  async getTextResult(promptId: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/history/${promptId}`
      );

      if (!response.data || !response.data[promptId]) {
        return null;
      }

      const data = response.data[promptId];
      const outputs = data.outputs;

      if (!outputs || typeof outputs !== "object") {
        return null;
      }

      let textResult = "";

      Object.keys(outputs).forEach((key) => {
        const output = outputs[key];
        if (output.text) {
          let text = "";
          if (Array.isArray(output.text)) {
            text = output.text.join("");
          } else if (typeof output.text === "string") {
            text = output.text;
          }

          // 过滤Qwen3思考过程
          textResult += this.filterThinkingContent(text);
        } else {
          console.warn("Invalid output format:", output);
        }
      });

      return textResult || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        console.error("Error fetching result:", error.message);
      }
      return null;
    }
  }

  async getAudioResult(promptId: string): Promise<string[] | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/history/${promptId}`
      );

      if (!response.data || !response.data[promptId]) {
        return null;
      }

      const data = response.data[promptId];

      if (!data.outputs || typeof data.outputs !== "object") {
        return null;
      }

      const filepaths: string[] = [];

      Object.keys(data.outputs).forEach((key) => {
        const output = data.outputs[key];
        if (output.audio_files && Array.isArray(output.audio_files)) {
          output.audio_files.forEach((audio: any) => {
            const filename = audio.filename;
            const folder = audio.type || "audio";
            filepaths.push(`${this.comfyUIDir}/${folder}/${filename}`);
          });
        } else if (output.audio && typeof output.audio === "object") {
          const filename = output.audio.filename;
          const folder = output.audio.type || "audio";
          filepaths.push(`${this.comfyUIDir}/${folder}/${filename}`);
        }
      });

      return filepaths.length > 0 ? filepaths : null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        console.error("Error fetching audio result:", error.message);
      }
      return null;
    }
  }

  /**
   * 过滤掉模型输出中的思考过程（<think>...</think>标签及内容）
   * @param text 原始文本
   * @returns 过滤后的文本
   */
  private filterThinkingContent(text: string): string {
    // 移除<think>...</think>标签及其中的内容
    return text.replace(/<think>[\s\S]*?<\/think>/g, "");
  }
}

export default new ComfyUIService();
