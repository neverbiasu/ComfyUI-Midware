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

  async getImageResult(promptId: string): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/history/${promptId}`
      );

      const data = response.data[promptId];
      const outputs = data.outputs;

      if (!outputs || typeof outputs !== "object") {
        throw new Error("Invalid outputs data");
      }

      const filepaths: string[] = [];

      Object.keys(outputs).forEach((key) => {
        const output = outputs[key];
        if (output.images && Array.isArray(output.images)) {
          output.images.forEach((image: any) => {
            const filename = image.filename;
            const folder = image.type;
            filepaths.push(`${this.comfyUIDir}/${folder}/${filename}`);
          });
        } else {
          console.warn("Invalid output format:", output);
        }
      });

      return filepaths;
    } catch (error) {
      console.error("Error fetching result:", error);
      throw new Error("Fetching result failed");
    }
  }

  async getTextResult(promptId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/history/${promptId}`
      );

      const data = response.data[promptId];
      const outputs = data.outputs;

      if (!outputs || typeof outputs !== "object") {
        throw new Error("Invalid outputs data");
      }

      let textResult = "";

      Object.keys(outputs).forEach((key) => {
        const output = outputs[key];
        if (output.text) {
          if (Array.isArray(output.text)) {
            textResult += output.text.join("");
          } else if (typeof output.text === "string") {
            textResult += output.text;
          }
        } else {
          console.warn("Invalid output format:", output);
        }
      });

      return textResult;
    } catch (error) {
      console.error("Error fetching result:", error);
      throw new Error("Fetching result failed");
    }
  }
}

export default new ComfyUIService();
