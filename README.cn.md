# ComfyUI 中间件

## 简介

该项目是 ComfyUI 的中间件，旨在将各种工作流封装为可访问的 API。它主要支持我的本科毕业论文项目，目标是为叙事卡牌游戏提供多模态 AI 功能。

## 动机

随着游戏行业的发展，尤其是叙事游戏，对沉浸式体验的需求显著增加。游戏开发者面临着大量内容创作的需求，这通常需要大量的人力和时间资源。多模态 AI 技术可以显著优化这一过程，提供更高效、更灵活的开发工具。

本研究旨在使用 **Python** 和 **TypeScript** 构建一个综合模型工作流，集成 **ms-swift** 和 **ComfyUI**。通过利用诸如 **Qwen2.5Coder-7B** 和 **Qwen2.5-7B-Instruct** 等大型语言模型，以及 **SDXL** 或 **Flux** 等文本到图像模型，我们为叙事游戏提供定制化的多模态 API 工具。目标是提高游戏内容生成的速度和质量，从而降低开发成本并提高效率。

## 目标

1. **构建和训练定制模型**：使用 **ms-swift** 和 **sd-scripts** 根据特定游戏需求训练和优化大型语言模型和文本到图像模型。
2. **优化多模态工作流**：使用 **ComfyUI** 构建高效的图像生成工作流，并与 **NodeJS (Express, Nodemon, Axios)** 集成进行 API 封装，实现高效复用和快速生成。
3. **API 集成和性能优化**：通过 POST 请求和 Promise 并发控制优化 API 调用效率，并与主流游戏引擎如 Unity 和 Unreal Engine (UE) 集成。
4. **评估和验证**：使用质量评估指标（SSIM、FID、CLIPScore）和 LLM Bench 评估模型生成效果，并验证项目的实际影响。

## 安装

### 要求

- [Node.js](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
- [Python](https://www.python.org/downloads/)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- [ms-swift](https://github.com/modelscope/ms-swift)
- [sd-scripts](https://github.com/kohya-ss/sd-scripts)

### 步骤

1. **克隆仓库**：

   ```sh
   git clone https://github.com/neverbiasu/comfyui-midware.git
   cd comfyui-midware
   ```

2. **安装依赖**：

   ```sh
   npm install
   ```

3. **设置环境变量**：
   在根目录创建 `.env` 文件并添加以下内容：

   ```env
   COMFYUI_DIR=/path/to/comfyui
   ```

4. **运行应用程序**：
   ```sh
   npm run dev
   ```

## 暴露本地服务器

Cloudflare Tunnel 允许您将本地服务器暴露给公众。

### 安装

1. **下载并安装**：从 [Cloudflare Tunnel 网站](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation)获取 Cloudflare Tunnel。

### 配置

1. **登录 Cloudflare**：

```sh
cloudflared login
```

在 PowerShell 中使用您的 Cloudflare 账户进行身份验证。

1. **启动 Tunnel**：

```sh
cloudflared tunnel --url http://localhost:3000
```

```sh
cloudflared tunnel --config C:\Users\DELL\Desktop\workspace\ComfyUI-Midware\config.yml run midware-tunnel```
运行 Cloudflare Tunnel 命令，为您的本地服务器生成一个公共 URL。

## API 使用

### 可用端点

- **风格迁移**：`/api/style_transfer`
- **文本到肖像**：`/api/text_to_portrait`

### 示例请求

#### 风格迁移

```sh
curl -X POST http://localhost:3000/api/style_transfer \
  -F "content=@path/to/content.jpg" \
  -F "style=@path/to/style.jpg" \
  -F "positivePrompt=positive prompt text" \
  -F "negativePrompt=negative prompt text"
```

#### 文本到肖像

```sh
curl -X POST http://localhost:3000/api/text_to_portrait \
  -F "text=a girl"
```

## 结论

该项目展示了多模态 AI 在叙事游戏开发中的应用，提供了一个综合的工作流和 API 工具来增强游戏内容生成。通过利用大型语言模型和文本到图像模型，我们旨在提高游戏开发的效率和质量，为开发者提供有价值的工具集。
