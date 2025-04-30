const axios = require("axios");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let startRound = 0;
if (args.length > 0) {
  const roundArg = parseInt(args[0]);
  if (!isNaN(roundArg) && roundArg >= 0 && roundArg < BATCH_SIZE) {
    startRound = roundArg;
    console.log(`从第 ${startRound} 轮开始继续生成`);
  } else {
    console.error(`无效的起始轮次: ${args[0]}. 必须在 0 和 ${BATCH_SIZE-1} 之间`);
    process.exit(1);
  }
}

// 配置参数
const API_URL = "http://localhost:3000/api/text_gen";
const BATCH_SIZE = 100; // 要生成的剧情数量
const DATA_DIR = path.join(__dirname, "../data");

// 阶段设置
const PHASES = {
  BEGINNING: { start: 0, end: 39 }, // 0-39轮
  DEVELOPMENT: { start: 40, end: 79 }, // 40-79轮
  ENDING: { start: 80, end: 99 }, // 80-99轮
};

// 不同阶段的系统提示词
const SYSTEM_PROMPTS = {
  BEGINNING: `扮演一位资深的文字游戏作者，请你根据之前发生的故事和玩家做出的选择和结果，并参考故事的风格倾向，为角色继续讲述，在故事的开头你需要简单交代前情并继续描述后续的发展，并为玩家生成三个可以选择的行动，每个行动后用括号标注这个选择会需要使用玩家的哪项属性，可以选择的属性包括无、力量、敏捷、体质、感知、魅力、智力。当前是剧情的开端部分，你应该逐步展开故事，并尽可能为后续的故事提供线索和引导。

请记得为最有趣的选项添加[选择]标记。故事应反映角色的过去经历，并与故事风格主题（道德挣扎、生存与救赎、科技与人性）保持一致。`,

  DEVELOPMENT: `扮演一位资深的文字游戏作者，请你根据之前发生的故事和玩家做出的选择和结果，并参考故事的风格倾向，为角色继续讲述，在故事的开头你需要简单交代前情并继续描述后续的发展，并为玩家生成三个可以选择的行动，每个行动后用括号标注这个选择会需要使用玩家的哪项属性，可以选择的属性包括无、力量、敏捷、体质、感知、魅力、智力。当前是剧情的发展部分，你应该根据之前的故事，尽可能展现剧情的冲突与精彩的对抗，并给予主人公合适的挑战。

请记得为最有趣的选项添加[选择]标记。故事应反映角色的过去经历，并与故事风格主题（道德挣扎、生存与救赎、科技与人性）保持一致。`,

  ENDING: `扮演一位资深的文字游戏作者，请你根据之前发生的故事和玩家做出的选择和结果，并参考故事的风格倾向，为角色继续讲述，在故事的开头你需要简单交代前情并继续描述后续的发展，并为玩家生成三个可以选择的行动，每个行动后用括号标注这个选择会需要使用玩家的哪项属性，可以选择的属性包括无、力量、敏捷、体质、感知、魅力、智力。当前是剧情的结局部分，你应该根据之前的故事，为当前的剧情逐步收尾。
  
  **注意：只有在第99轮（即最后一轮）时，你才可以结束故事并给出结局。如果是第99轮且你认为故事可以结束，你可以结束这个故事，并且不必再生成选项而是给出结局，结局末尾加上"故事终"。在第99轮之前，无论剧情如何发展，都不要结束故事，必须继续生成剧情和选项。**
  
  除非是最终结局，否则请记得为最有趣的选项添加[选择]标记。故事应反映角色的过去经历，并与故事风格主题（道德挣扎、生存与救赎、科技与人性）保持一致。`,
};

// 初始用户提示
const INITIAL_USER_PROMPT = `剧情开头：2077年的新扬城，一座被霓虹灯和巨型广告牌覆盖的钢铁丛林。这里的天空被污染成永恒的灰色，被各大公司控制的区域宛如孤岛，而城市的底层则是犯罪和绝望的温床。

你——代号"幽影"，曾是底层贫民窟的孤儿，后来加入街头帮派求生存，现已成为一名半机械化的雇佣兵。今晚，你刚完成一项为某大公司清除竞争对手的任务，血迹未干的机械臂提醒着你的选择。

当你走进"电子天堂"酒吧寻找下一单生意时，发现一位曾被你救过的少女——莉娜正在吧台等你。她的眼中闪烁着绝望，嘴唇颤抖着说："他们抓走了我的弟弟，说要把他改造成战斗机器人...只因为他目睹了公司的秘密交易。"

你的金属手指敲击着吧台，内心善良与雇佣兵的职业素养开始拉扯。该如何回应？

A. 直截了当询问更多细节，确定是否值得冒险（智力）
B. 安抚她的情绪，承诺帮助她找回弟弟（魅力）
C. 暗中联系你的黑客朋友，获取公司内部布局（感知）`;

// 确保data目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`创建目录: ${DATA_DIR}`);
}

/**
 * 根据当前轮数获取对应的系统提示词
 * @param {number} round 当前轮数
 * @returns {string} 系统提示词
 */
function getSystemPromptForRound(round) {
  let basePrompt;
  if (round >= PHASES.ENDING.start) {
    basePrompt = SYSTEM_PROMPTS.ENDING;
  } else if (round >= PHASES.DEVELOPMENT.start) {
    basePrompt = SYSTEM_PROMPTS.DEVELOPMENT;
  } else {
    basePrompt = SYSTEM_PROMPTS.BEGINNING;
  }
  return `【当前是第${round + 1}轮/共99轮】\n${basePrompt}`;
}

/**
 * 调用text_gen接口生成剧情
 * @param {string} userPrompt 用户提示词
 * @param {string} systemPrompt 系统提示词
 * @returns {Promise<string>} 生成的剧情文本
 */
async function generatePlot(userPrompt, systemPrompt) {
  try {
    const response = await axios.post(
      API_URL,
      {
        userPrompt: userPrompt,
        systemPrompt: systemPrompt,
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
    throw error;
  }
}

/**
 * 解析剧情文本，提取选项和选择
 * @param {string} text 剧情文本
 * @param {number} round 当前轮数
 * @returns {Object} 包含剧情、选项和选择的对象
 */
function parseStoryAndChoices(text, round) {
  // 检查是否是结局（包含"故事终"）
  const isEnding = text.includes("故事终");

  if (isEnding) {
    console.log("检测到故事结局！");
    return { fullText: text, selectedChoice: null, isEnding: true };
  }

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

  return { fullText: text, selectedChoice, isEnding: false };
}

/**
 * 批量生成剧情并保存
 */
async function batchGeneratePlots() {
  // 初始化用户提示
  let userPrompt = INITIAL_USER_PROMPT;
  let isStoryEnded = false;

  // 如果从非零轮次开始，需要读取上一轮的内容
  if (startRound > 0) {
    const previousRoundFile = path.join(DATA_DIR, `${startRound}.txt`);
    
    if (fs.existsSync(previousRoundFile)) {
      const previousContent = fs.readFileSync(previousRoundFile, 'utf-8');
      
      // 解析上一轮的选择
      const { fullText, selectedChoice } = parseStoryAndChoices(previousContent, startRound - 1);
      
      if (selectedChoice) {
        userPrompt = `${fullText}\n\n玩家选择了选项${selectedChoice}。根据这个选择，请继续故事：`;
        console.log(`已加载第 ${startRound} 轮内容，选择了选项 ${selectedChoice}`);
      } else {
        console.error(`无法从第 ${startRound} 轮确定所选择的选项`);
        process.exit(1);
      }
    } else {
      console.error(`未找到上一轮文件: ${previousRoundFile}`);
      process.exit(1);
    }
  }

  for (let i = startRound; i < BATCH_SIZE && !isStoryEnded; i++) {
    try {
      // 获取当前轮数对应的系统提示词
      const currentSystemPrompt = getSystemPromptForRound(i);

      // 输出当前所处的阶段
      let phase = "开端";
      if (i >= PHASES.ENDING.start) phase = "结局";
      else if (i >= PHASES.DEVELOPMENT.start) phase = "发展";

      console.log(`\n[第${i + 1}/${BATCH_SIZE}次生成 - ${phase}阶段]`);
      console.log(`用户提示词: ${userPrompt.substring(0, 100)}...`);

      // 调用API生成剧情，传递用户提示和系统提示
      const storyText = await generatePlot(userPrompt, currentSystemPrompt);

      // 解析剧情和选择
      const { fullText, selectedChoice, isEnding } = parseStoryAndChoices(
        storyText,
        i
      );

      // 保存当前剧情片段
      const filename = `${i + 1}.txt`;
      fs.writeFileSync(path.join(DATA_DIR, filename), fullText);
      console.log(`✓ 已保存剧情片段 ${i + 1} (${phase}阶段)`);

      // 如果是结局，标记故事已结束
      if (isEnding || i === BATCH_SIZE - 1) {
        console.log("故事已结束！");
        isStoryEnded = true;
        break;
      }

      // 更新下一轮的用户提示
      userPrompt = `${fullText}\n\n玩家选择了选项${selectedChoice}。根据这个选择，请继续故事：`;

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

  console.log(
    "\n剧情生成完成！总共生成了" +
      (isStoryEnded ? "一个完整的故事" : `${BATCH_SIZE}个剧情片段`)
  );
}

// 执行批量生成
batchGeneratePlots().catch(console.error);
