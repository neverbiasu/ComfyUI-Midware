import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const baseUrls = ["http://localhost:8188"];

class ComfyUIService {
  private baseUrl: string;
  private comfyUIDir: string;

  constructor() {
    this.baseUrl = baseUrls[0];
    this.comfyUIDir = process.env.COMFYUI_DIR as string;
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
}

export default new ComfyUIService();
