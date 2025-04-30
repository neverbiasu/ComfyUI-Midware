const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:3000/api/text_gen";
const OUT_DIR = path.join(__dirname, "../data/character_desc");
const COUNT = 100; // 总共生成数量
const BATCH = 10; // 每次生成10个

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const lengthTypes = [
  { label: "短", desc: "请用一句话简短描述" },
  { label: "中", desc: "请用2-3句话中等长度描述" },
  { label: "长", desc: "请用一段详细描述，突出背景和细节" },
];

const baseThemes = [
  "赛博朋克",
  "机械武士",
  "未来都市赏金猎人",
  "二次元卡通",
  "暗黑地下城",
  "魔法少女",
  "超能力者",
  "中世纪奇幻",
  "蒸汽朋克",
  "赏金女猎人",
];

async function main() {
  for (let batchIdx = 0; batchIdx < COUNT / BATCH; batchIdx++) {
    const theme = baseThemes[batchIdx % baseThemes.length];
    const lengthType = lengthTypes[batchIdx % lengthTypes.length];
    const userPrompt = `请生成10个${theme}风格的角色描述，每个${lengthType.label}，每个描述之间用"---"分隔。${lengthType.desc}`;
    const systemPrompt = `你是一名专业的角色设定文案设计师，请根据用户输入的主题和长度要求，生成10个不同的${lengthType.label}角色描述，每个描述之间用"---"分隔，内容不要重复。`;

    try {
      const res = await axios.post(
        API_URL,
        {
          userPrompt,
          systemPrompt,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const text = res.data.text || res.data;
      // 拆分并去除空行
      const descList = text
        .split(/-{3,}/)
        .map((s) => s.trim())
        .filter(Boolean);
      const filename = `character_desc_batch_${batchIdx + 1}.txt`;
      fs.writeFileSync(
        path.join(OUT_DIR, filename),
        descList.join("\n---\n"),
        "utf-8"
      );
      console.log(`★ 已保存: ${filename}（共${descList.length}条）`);
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`第${batchIdx + 1}批生成失败:`, err.message);
      await new Promise((r) => setTimeout(r, 2000));
      batchIdx--; // 失败重试
    }
  }
  console.log("全部生成完毕！");
}

main();
