const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

// 实验配置
const experiments = {
  // 采样器与调度器消融实验
  sampler_scheduler: {
    // 优化采样器与调度器选择，理由如下：
    // - 采样器选择覆盖主流实际应用和学术常用类型，兼顾速度、质量和多样性（如Euler、DPM、DDPM、UniPC、IPNDM、DEIS、LCM等）。
    // - 调度器选择覆盖最常用的调度策略，避免冷门和实验性调度器，减少无效组合。
    // - 每个采样器只与最有代表性的调度器组合，减少无意义的全排列，提升实验效率。
    samplers: [
      "euler_ancestral", // 经典采样器，速度快，常用
      "dpmpp_2m", // 高质量采样器，SDXL推荐
      "dpmpp_2s_ancestral", // 兼顾速度和质量
      "ddpm", // 原始扩散采样器，学术基线
      "uni_pc", // 新一代高效采样器
      "ipndm", // 近年提出的高效采样器
      "deis", // 速度快，质量好
    ],
    schedulers: [
      "normal", // 标准调度器，适配大多数采样器
      "karras", // Karras调度，提升高步数采样质量
      "exponential", // 指数调度，部分采样器推荐
      "sgm_uniform", // SGM模型常用
      "simple", // 简单调度，部分采样器默认
    ],
    // 文件命名规则
    filename: ({ base, sampler, scheduler }) =>
      `${base}_sampler_${sampler}_scheduler_${scheduler}.png`,
  },
  // UNet模型消融实验
  unet: {
    models: [
      "sdxl_lightning_1step_unet_x0.safetensors",
      "sdxl_lightning_2step_unet.safetensors",
      "sdxl_lightning_4step_unet.safetensors",
    ],
    filename: ({ base, unet }) => `${base}_unet_${unet}.png`,
  },
  // CFG-Zero-Star消融实验
  cfg_zero_star: {
    options: ["on", "off"],
    filename: ({ base, cfg_zero_star }) => `${base}_cfg_${cfg_zero_star}.png`,
  },
  // 每个消融实验总共跑多少组
  num_samples: 10,
};

// 随机抽取n个元素
function getRandom(arr, n) {
  const result = [];
  const used = new Set();
  while (result.length < n && used.size < arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!used.has(idx)) {
      result.push(arr[idx]);
      used.add(idx);
    }
  }
  return result;
}

// 从指定目录随机加载测试数据集（图像和描述独立随机选），并复制到ablation目录下
function loadTestData(n) {
  const imageDir = path.join(__dirname, "../data/100");
  const descDir = path.join(__dirname, "../data/character_desc");
  const ablationPortraitDir = path.join(__dirname, "../data/ablation/portrait");
  const ablationDescDir = path.join(
    __dirname,
    "../data/ablation/character_desc"
  );

  if (!fs.existsSync(imageDir)) {
    console.error(`图像目录不存在: ${imageDir}`);
    return [];
  }
  if (!fs.existsSync(descDir)) {
    console.error(`描述目录不存在: ${descDir}`);
    return [];
  }
  if (!fs.existsSync(ablationPortraitDir)) {
    fs.mkdirSync(ablationPortraitDir, { recursive: true });
  }
  if (!fs.existsSync(ablationDescDir)) {
    fs.mkdirSync(ablationDescDir, { recursive: true });
  }

  const imageFiles = fs
    .readdirSync(imageDir)
    .filter((file) => /\.(jpg|jpeg|png)$/i.test(file));
  const descFiles = fs
    .readdirSync(descDir)
    .filter((file) => file.endsWith(".txt"));

  const selectedImages = getRandom(imageFiles, n);
  const selectedDescs = getRandom(descFiles, n);

  const testData = [];
  for (
    let i = 0;
    i < Math.min(selectedImages.length, selectedDescs.length);
    i++
  ) {
    try {
      // 保持原始文件名（数字编号），如 1.png、1.txt
      const portraitName = selectedImages[i];
      const descName = selectedDescs[i];
      // 复制到ablation目录下
      fs.copyFileSync(
        path.join(imageDir, portraitName),
        path.join(ablationPortraitDir, portraitName)
      );
      fs.copyFileSync(
        path.join(descDir, descName),
        path.join(ablationDescDir, descName)
      );
      testData.push({
        description: fs
          .readFileSync(path.join(descDir, descName), "utf-8")
          .trim(),
        portrait: portraitName,
        base: path.parse(portraitName).name, // 例如 "1"
      });
    } catch (error) {
      console.error(`读取描述文件失败: ${selectedDescs[i]}`, error);
    }
  }

  console.log(`随机抽取并复制了 ${testData.length} 组测试数据`);
  return testData;
}

// 加载测试数据集
const testData = loadTestData(experiments.num_samples);

// 创建结果目录
const resultsDir = path.join(__dirname, "../data/ablation");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// 执行采样器与调度器消融实验
async function runSamplerSchedulerAblation() {
  const outputBaseDir = path.join(resultsDir, "sampler_scheduler");
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  console.log("开始执行采样器与调度器消融实验...");

  for (const testCase of testData) {
    for (const sampler of experiments.sampler_scheduler.samplers) {
      for (const scheduler of experiments.sampler_scheduler.schedulers) {
        const comboDir = path.join(outputBaseDir, `${sampler}_${scheduler}`);
        if (!fs.existsSync(comboDir)) {
          fs.mkdirSync(comboDir, { recursive: true });
        }
        try {
          const result = await sendRequest({
            characterDescription: testCase.description,
            portrait: testCase.portrait,
            sampler,
            scheduler,
            loraStyle: "DarkestDungeonSDXL",
          });

          // 文件命名规则
          const filename = experiments.sampler_scheduler.filename({
            base: testCase.base,
            sampler,
            scheduler,
          });
          fs.writeFileSync(path.join(comboDir, filename), result, "binary");
          console.log(`生成图片: ${comboDir}/${filename}`);
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
  const outputBaseDir = path.join(resultsDir, "unet");
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  console.log("开始执行UNet模型消融实验...");

  for (const testCase of testData) {
    for (const unet of experiments.unet.models) {
      const unetDir = path.join(
        outputBaseDir,
        unet.replace(/\.safetensors$/, "")
      );
      if (!fs.existsSync(unetDir)) {
        fs.mkdirSync(unetDir, { recursive: true });
      }
      try {
        const result = await sendRequest({
          characterDescription: testCase.description,
          portrait: testCase.portrait,
          unet,
          loraStyle: "DarkestDungeonSDXL",
        });

        // 文件命名规则
        const filename = experiments.unet.filename({
          base: testCase.base,
          unet,
        });
        fs.writeFileSync(path.join(unetDir, filename), result, "binary");
        console.log(`生成图片: ${unetDir}/${filename}`);
      } catch (error) {
        console.error(`生成失败: unet=${unet}`, error.message);
      }
    }
  }

  console.log("UNet模型消融实验完成");
}

// 执行CFG-Zero-Star消融实验
async function runCfgZeroStarAblation() {
  const outputBaseDir = path.join(resultsDir, "cfg_zero_star");
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  console.log("开始执行CFG-Zero-Star消融实验...");

  for (const testCase of testData) {
    for (const cfg_zero_star of experiments.cfg_zero_star.options) {
      const cfgDir = path.join(outputBaseDir, cfg_zero_star);
      if (!fs.existsSync(cfgDir)) {
        fs.mkdirSync(cfgDir, { recursive: true });
      }
      try {
        const result = await sendRequest({
          characterDescription: testCase.description,
          portrait: testCase.portrait,
          cfg_zero_star,
          loraStyle: "DarkestDungeonSDXL",
        });

        // 文件命名规则
        const filename = experiments.cfg_zero_star.filename({
          base: testCase.base,
          cfg_zero_star,
        });
        fs.writeFileSync(path.join(cfgDir, filename), result, "binary");
        console.log(`生成图片: ${cfgDir}/${filename}`);
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

  // 添加图片文件
  const portraitPath = path.join(__dirname, "../data/100", params.portrait);
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
