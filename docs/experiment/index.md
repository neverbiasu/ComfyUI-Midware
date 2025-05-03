# Experiment Groups and Progress Summary

## Directory Navigation

- [Character Portrait Generation](./character_portrait_generation.md)
- [Plot Image Generation](./plot_image_generation.md)
- [Performance Test](./performance_test.md)
- [UNet Ablation](./unet_ablation.md)
- [Sampler and Scheduler Ablation](./sampler_scheduler_ablation.md)
- [CFG-Zero-Star Ablation](./cfg_zero_star_ablation.md)
- [Quantization Ablation](./quantization_ablation.md)
- [Notes](./notes.md)
- [Future Plans](./future_plans.md)

## 1. 生成质量验证

- **角色肖像生成**
  - 输入：角色描述（如“一个赛博忍者”）、人脸图片、风格（loraStyle）
  - 输出：角色肖像图片
  - 结果存放：`data/character_portrait/`
  - 实验目的：验证角色肖像生成接口的输出质量

- **剧情图生成**
  - 输入：剧情描述、人物图片、风格（loraStyle）
  - 输出：剧情图像
  - 结果存放：`data/plot_image/`
  - 实验目的：验证剧情图生成接口的输出质量

---

## 2. 性能测试（所有接口）

- **目标**：评估各生成接口（如 text_gen、character_portrait_gen、plot_image_gen）的响应速度、并发能力和稳定性
- **方法**：批量/并发请求，统计平均响应时间、成功率等
- **进度**：待完成

---

## 3. 消融实验

### 3.1 UNet模型消融【表】

- **目标**：对比不同UNet模型对生成效果的影响
- **方法**：分别指定不同UNet模型参数，生成同一批输入，结果以表格形式展示
- **进度**：待完成

### 3.2 采样器和调度器组合消融【表】

- **目标**：对比不同采样器与调度器组合对生成效果的影响
- **方法**：遍历采样器和调度器组合，生成同一批输入，结果以表格形式展示
- **进度**：待完成

### 3.3 CFG-Zero-Star消融【图】

- **目标**：在最优UNet和采样器调度器组合下，测试不同CFG-Zero-Star参数对生成效果的影响
- **方法**：固定其他参数，仅调整CFG-Zero-Star，结果以图像形式展示
- **进度**：待完成

### 3.4 不同量化方法模型消融【表】

- **目标**：对比不同量化方法下模型的生成效果
- **方法**：分别加载不同量化模型，生成同一批输入，结果以表格形式展示
- **进度**：待完成

---

## 4. 说明

- 【表】：实验结果将以对照表格形式在论文中展示
- 【图】：实验结果将以曲线或柱状图等图像形式在论文中展示
- 所有实验结果及日志建议存放于 `data/实验名/` 子目录，并配套 `README.md` 记录参数与结论

---

## 5. 后续计划

- 完善性能测试脚本，支持多接口并发与统计
- 编写消融实验自动化脚本，支持批量参数遍历与结果归档
- 持续补充实验记录与分析文档

---