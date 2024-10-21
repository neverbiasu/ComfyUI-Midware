import axios from "axios";

const baseUrls = ["http://172.17.192.1:8188", "http://127.0.0.1:8188"];

class ComfyUIService {
  private baseUrl: string;

  constructor() {
    // 默认使用第一个URL，如果无法连接可以做更多逻辑处理
    this.baseUrl = baseUrls[0];
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

  async getResult(promptId: string): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/history/${promptId}`
      );
      const outputs = response.data.outputs;
      const filenames = outputs.map((output: any) => output.filename);
      return filenames;
    } catch (error) {
      console.error("Error fetching result:", error);
      throw new Error("Fetching result failed");
    }
  }
}

export default new ComfyUIService();
