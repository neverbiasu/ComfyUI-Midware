const axios = require("axios");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// 配置参数
const API_URL = "http://localhost:3000/plot_gen"; // 根据你的实际服务端口调整
const BATCH_SIZE = 10; // 要生成的剧情数量
const DATA_DIR = path.join(__dirname, "../data");
const INITIAL_PROMPT = `你是一个交互式剧情生成器。我会给你一个剧情开头，请你生成剧情发展和三个可能的选项(A、B、C)，然后自动选择一个最有趣的选项(在选项后标注[选择])。
剧情开头：拉里昂王国曾经是一个繁荣昌盛的土地，充满了魔法和奇迹，但随着国王的衰老，王国开始衰落。

现在，随着国王的去世，他的权力狂热的兄弟回到了王位，将整个拉里昂王国陷入混乱！

你是一位忠诚于前国王的骑士，你发誓不惜一切代价阻止这位新暴君！你骑着你的忠诚坐骑，进入托顿镇，前往当地的酒馆：飞马酒馆。当你穿过那扇破旧的木门时，你注意到你的老朋友亨利爵士在一个餐桌盘享用着他的午餐。

以下是玩家当前的选项，请从中选择一个（在选择的选项后标记[选择]），并继续生成故事情节：

A.热情的向他打个招呼（无）
B.为酒吧所有人点一杯酒（魅力）
C.向老板打听最近的新闻（感知）`;

// 确保data目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`创建目录: ${DATA_DIR}`);
}

/**
 * 调用plot_gen接口生成剧情
 * @param {string} prompt 剧情提示词
 * @returns {Promise<string>} 生成的剧情文本
 */
/**
 * 调用plot_gen接口生成剧情
 * @param {string} prompt 剧情提示词
 * @returns {Promise} 生成的剧情文本
 */
async function generatePlot(prompt) {
  try {
    const response = await axios.post(
      API_URL,
      {
        prompt: prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error instanceof axios.AxiosError) {
      console.error("生成剧情失败:", error.message);
      if (error.response) {
        console.error("响应数据:", error.response.data);
      }
    } else if (error instanceof Error) {
      console.error("生成剧情失败:", error.message);
    }
    throw error; // Re-throw the error after logging
  }
}

/**
 * 解析剧情文本，提取选项和选择
 * @param {string} text 剧情文本
 * @returns {Object} 包含剧情、选项和选择的对象
 */
function parseStoryAndChoices(text) {
  // 查找包含[选择]标记的选项
  const choiceRegex = /([A-C])[.、：:]\s*(.*?)\s*\[选择\]/i;
  const match = text.match(choiceRegex);

  let selectedChoice = "";
  if (match) {
    selectedChoice = match[1]; // A, B 或 C
  } else {
    // 如果没有找到[选择]标记，默认选择A
    selectedChoice = "A";
    // 在第一个选项后添加[选择]标记
    text = text.replace(
      /A[.、：:]\s*(.*?)(?=\s*B[.、：:]|\s*$)/i,
      "A. $1 [选择]"
    );
  }

  return { fullText: text, selectedChoice };
}

/**
 * 批量生成剧情并保存
 */
async function batchGeneratePlots() {
  let storyContext = INITIAL_PROMPT;
  let currentPrompt = INITIAL_PROMPT;

  for (let i = 0; i < BATCH_SIZE; i++) {
    try {
      console.log(`\n[第${i + 1}/${BATCH_SIZE}次生成]`);
      console.log(`提示词: ${currentPrompt.substring(0, 100)}...`);

      // 调用API生成剧情
      const storyText = await generatePlot(currentPrompt);

      // 解析剧情和选择
      const { fullText, selectedChoice } = parseStoryAndChoices(storyText);

      // 更新剧情上下文
      storyContext += `\n\n--- 剧情片段 ${i + 1} ---\n\n${fullText}`;

      // 保存当前完整剧情
      const filename = `story_batch_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}_${i + 1}.txt`;
      fs.writeFileSync(path.join(DATA_DIR, filename), storyContext);

      // 提取选择后的内容作为下一轮的输入
      const nextPromptSuffix = `根据之前的剧情，玩家选择了选项${selectedChoice}，请继续生成剧情发展和新的三个选项(A、B、C)，然后自动选择一个最有趣的选项(在选项后标注[选择])。`;
      currentPrompt = `${storyContext}\n\n${nextPromptSuffix}`;

      // 暂停一下，避免频繁请求
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      if (error instanceof Error) {
        console.error(`第${i + 1}次生成失败:`, error.message);
      } else {
        console.error(`第${i + 1}次生成失败:`, String(error));
      }

      // 失败后等待更长时间再重试
      await new Promise((resolve) => setTimeout(resolve, 5000));
      i--; // 重试当前轮次
    }
  }
}

// 执行批量生成
batchGeneratePlots().catch(console.error);
