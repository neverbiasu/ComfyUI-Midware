const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

// 实验配置
const experiments = {
  // 采样器与调度器消融实验
  sampler_scheduler: {
    samplers: [
      "euler",
      "euler_ancestral",
      "dpm_2",
      "dpm_2_ancestral",
      "dpmpp_2s_ancestral",
      "dpmpp_sde",
      "dpmpp_2m",
    ],
    schedulers: ["normal", "karras", "exponential", "sgm_uniform", "simple"],
  },
  // UNet模型消融实验
  unet: {
    models: ["unet_standard", "unet_plus", null], // null表示默认UNet
  },
  // CFG-Zero-Star消融实验
  cfg_zero_star: {
    options: ["on", "off"],
  },
};

// 从指定目录加载测试数据集
function loadTestData() {
  const imageDir = path.join(__dirname, "../data/100");
  const descDir = path.join(__dirname, "../data/character_desc");

  // 确保目录存在
  if (!fs.existsSync(imageDir)) {
    console.error(`图像目录不存在: ${imageDir}`);
    return [];
  }

  if (!fs.existsSync(descDir)) {
    console.error(`描述目录不存在: ${descDir}`);
    return [];
  }

  // 读取图像文件
  const imageFiles = fs
    .readdirSync(imageDir)
    .filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

  // 读取描述文件
  const descFiles = fs
    .readdirSync(descDir)
    .filter((file) => file.endsWith(".txt"));

  // 匹配图像和描述
  const testData = [];

  for (const imageFile of imageFiles) {
    const baseName = imageFile.split(".")[0];
    const descFile = `${baseName}.txt`;

    // 检查是否存在对应的描述文件
    if (descFiles.includes(descFile)) {
      try {
        const description = fs
          .readFileSync(path.join(descDir, descFile), "utf-8")
          .trim();
        testData.push({
          description: description,
          portrait: imageFile, // Store only the filename
        });
      } catch (error) {
        console.error(`读取描述文件失败: ${descFile}`, error);
      }
    }
  }

  console.log(`加载了 ${testData.length} 组测试数据`);

  // 如果数据过多，可以只使用一部分进行测试
  const maxSamples = 5; // 最多使用5组测试数据
  return testData.slice(0, maxSamples);
}

// 加载测试数据集
const testData = loadTestData();

// 创建结果目录
const resultsDir = path.join(__dirname, "../data/ablation");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// 执行采样器与调度器消融实验
async function runSamplerSchedulerAblation() {
  const outputDir = path.join(resultsDir, "sampler_scheduler");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("开始执行采样器与调度器消融实验...");

  for (const testCase of testData) {
    for (const sampler of experiments.sampler_scheduler.samplers) {
      for (const scheduler of experiments.sampler_scheduler.schedulers) {
        try {
          const result = await sendRequest({
            characterDescription: testCase.description,
            portrait: testCase.portrait,
            sampler,
            scheduler,
            loraStyle: "DarkestDungeonSDXL", // 使用固定风格进行测试
          });

          // 将结果保存到对应目录
          const filename = `${
            testCase.portrait.split(".")[0]
          }_${sampler}_${scheduler}.png`;
          fs.writeFileSync(path.join(outputDir, filename), result, "binary");
          console.log(`生成图片: ${filename}`);
        } catch (error) {
          console.error(
            `生成失败: sampler=${sampler}, scheduler=${scheduler}`,
            error.message
          );
        }
      }
    }
  }

  console.log("采样器与调度器消融实验完成");
}

// 执行UNet模型消融实验
async function runUnetAblation() {
  const outputDir = path.join(resultsDir, "unet");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("开始执行UNet模型消融实验...");

  for (const testCase of testData) {
    for (const unet of experiments.unet.models) {
      try {
        const result = await sendRequest({
          characterDescription: testCase.description,
          portrait: testCase.portrait,
          unet,
          loraStyle: "DarkestDungeonSDXL",
        });

        // 将结果保存到对应目录
        const unetName = unet || "default";
        const filename = `${
          testCase.portrait.split(".")[0]
        }_unet_${unetName}.png`;
        fs.writeFileSync(path.join(outputDir, filename), result, "binary");
        console.log(`生成图片: ${filename}`);
      } catch (error) {
        console.error(`生成失败: unet=${unet}`, error.message);
      }
    }
  }

  console.log("UNet模型消融实验完成");
}

// 执行CFG-Zero-Star消融实验
async function runCfgZeroStarAblation() {
  const outputDir = path.join(resultsDir, "cfg_zero_star");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("开始执行CFG-Zero-Star消融实验...");

  for (const testCase of testData) {
    for (const cfg_zero_star of experiments.cfg_zero_star.options) {
      try {
        const result = await sendRequest({
          characterDescription: testCase.description,
          portrait: testCase.portrait,
          cfg_zero_star,
          loraStyle: "DarkestDungeonSDXL",
        });

        // 将结果保存到对应目录
        const filename = `${
          testCase.portrait.split(".")[0]
        }_cfg_${cfg_zero_star}.png`;
        fs.writeFileSync(path.join(outputDir, filename), result, "binary");
        console.log(`生成图片: ${filename}`);
      } catch (error) {
        console.error(
          `生成失败: cfg_zero_star=${cfg_zero_star}`,
          error.message
        );
      }
    }
  }

  console.log("CFG-Zero-Star消融实验完成");
}

// 发送请求到API
async function sendRequest(params) {
  const formData = new FormData();
  formData.append("characterDescription", params.characterDescription);

  // 添加图片文件 - 修改路径以使用 ../data/100
  const portraitPath = path.join(
    __dirname,
    "../data/100", // Changed directory here
    params.portrait
  );
  // Check if the file exists before attempting to read it
  if (!fs.existsSync(portraitPath)) {
    throw new Error(`Portrait file not found: ${portraitPath}`);
  }
  formData.append("portrait", fs.createReadStream(portraitPath));

  // 添加其他参数
  if (params.loraStyle) formData.append("loraStyle", params.loraStyle);
  if (params.sampler) formData.append("sampler", params.sampler);
  if (params.scheduler) formData.append("scheduler", params.scheduler);
  if (params.unet) formData.append("unet", params.unet);
  if (params.cfg_zero_star)
    formData.append("cfg_zero_star", params.cfg_zero_star);

  const response = await axios.post(
    "http://localhost:3000/api/character_portrait_ablation",
    formData,
    {
      headers: formData.getHeaders(),
      responseType: "arraybuffer",
    }
  );

  return response.data;
}

// 执行所有实验或单个实验
async function runExperiments(experimentType = "all") {
  try {
    switch (experimentType.toLowerCase()) {
      case "sampler_scheduler":
        await runSamplerSchedulerAblation();
        break;
      case "unet":
        await runUnetAblation();
        break;
      case "cfg_zero_star":
        await runCfgZeroStarAblation();
        break;
      case "all":
      default:
        await runSamplerSchedulerAblation();
        await runUnetAblation();
        await runCfgZeroStarAblation();
        break;
    }
    console.log("所有实验完成");
  } catch (error) {
    console.error("实验执行过程中出错:", error);
  }
}

// 获取命令行参数指定的实验类型
const experimentType = process.argv[2] || "all";
runExperiments(experimentType);
