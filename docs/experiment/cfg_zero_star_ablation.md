# CFG-Zero-Star消融实验设计

## 实验目标

在最优UNet和采样器调度器组合下，测试“有CFG-Zero-Star”和“无CFG-Zero-Star”两种情况下对生成效果的影响。

## 实验方法

1. 固定UNet模型和采样器调度器组合为最优配置。
2. 分别在“启用CFG-Zero-Star”和“不启用CFG-Zero-Star”两种设置下，对同一批输入进行生成。
3. 对比两组生成结果，观察图片质量、稳定性等方面的变化。
4. 结果以图表（拼图）形式展示。

## 评估指标

- 客观指标：如CLIPScore等。

## 结果归档

- 生成图片、参数配置、对比图表归档于 `data/ablation/cfg_zero_star/` 及本实验文档。
