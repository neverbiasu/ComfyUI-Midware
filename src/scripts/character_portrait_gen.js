const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const API_URL = "http://localhost:3000/api/character_portrait_gen";
const DESC_DIR = path.join(__dirname, "../data/character_desc");
const FACE_DIR = path.join(__dirname, "../data/100");
const OUT_DIR = path.join(__dirname, "../data/character_portrait");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const loraStyle = "DarkestDungeonSDXL";

// 获取描述和人脸图片文件名列表（假设都是1.txt/1.png这种编号）
const descFiles = fs.readdirSync(DESC_DIR).filter((f) => f.endsWith(".txt"));
const faceFiles = fs
  .readdirSync(FACE_DIR)
  .filter((f) => /\.(png|jpg|jpeg)$/i.test(f));

// 按编号排序，确保一一对应
descFiles.sort((a, b) => parseInt(a) - parseInt(b));
faceFiles.sort((a, b) => parseInt(a) - parseInt(b));

async function main() {
  for (let i = 0; i < Math.min(descFiles.length, faceFiles.length); i++) {
    const descPath = path.join(DESC_DIR, descFiles[i]);
    const facePath = path.join(FACE_DIR, faceFiles[i]);
    const desc = fs.readFileSync(descPath, "utf-8").trim();

    const form = new FormData();
    form.append("characterDescription", desc);
    form.append("loraStyle", loraStyle);
    form.append("portrait", fs.createReadStream(facePath));

    try {
      const res = await axios.post(API_URL, form, {
        headers: form.getHeaders(),
        responseType: "arraybuffer",
      });

      // 保存图片，文件名与描述编号一致
      const outFile = path.join(OUT_DIR, `${i + 1}.png`);
      fs.writeFileSync(outFile, res.data);
      console.log(`✓ 已生成: ${outFile}`);
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`第${i + 1}个生成失败:`, err.message);
      await new Promise((r) => setTimeout(r, 2000));
      i--; // 失败重试
    }
  }
  console.log("全部角色肖像生成完毕！");
}

main();
