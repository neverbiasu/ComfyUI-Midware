# ComfyUI Middleware

## Introduction

This project serves as middleware for ComfyUI, designed to wrap various workflows into accessible APIs. It primarily supports my undergraduate thesis project, which aims to empower a narrative card game with multimodal AI capabilities.

## Motivation

With the evolution of the gaming industry, especially narrative games, the demand for immersive experiences has significantly increased. Game developers face substantial content creation requirements, which traditionally involve considerable human and time resources. Multimodal AI technology can significantly optimize this process, providing more efficient and flexible development tools.

This research aims to build a comprehensive model workflow using **Python** and **TypeScript**, integrating **ms-swift** and **ComfyUI**. By leveraging large language models like **Qwen2.5Coder-7B** and **Qwen2.5-7B-Instruct**, as well as text-to-image models like **SDXL** or **Flux**, we provide customized multimodal API tools for narrative games. The goal is to enhance the speed and quality of game content generation, thereby reducing development costs and improving efficiency.

## Objectives

1. **Build and Train Custom Models**: Train and optimize large language models and text-to-image models using **ms-swift** and **sd-scripts** based on specific game requirements.
2. **Optimize Multimodal Workflows**: Use **ComfyUI** to build efficient image generation workflows, and integrate them with **NodeJS (Express, Nodemon, Axios)** for API encapsulation, enabling efficient reuse and rapid generation.
3. **API Integration and Performance Optimization**: Optimize API call efficiency through POST requests and Promise concurrency control, and integrate with mainstream game engines like Unity and Unreal Engine (UE).
4. **Evaluation and Validation**: Assess model generation effects using quality evaluation metrics (SSIM, FID, CLIPScore) and LLM Bench, and validate the project's practical impact.

## Installation

### Requirements

- [Node.js](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
- [Python](https://www.python.org/downloads/)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- [ms-swift](https://github.com/modelscope/ms-swift)
- [sd-scripts](https://github.com/kohya-ss/sd-scripts)

### Steps

1. **Clone the repository**:

   ```sh
   git clone https://github.com/neverbiasu/comfyui-midware.git
   cd comfyui-midware
   ```

2. **Install dependencies**:

   ```sh
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following:

   ```env
   COMFYUI_DIR=/path/to/comfyui
   ```

4. **Run the application**:
   ```sh
   npm run dev
   ```

## Exposing Local Server

Cloudflare Tunnel allows you to expose your local server to the public.

### Installation

1. **Download and Install**: Get Cloudflare Tunnel from the [Cloudflare Tunnel website](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation).

### Configuration

1. **Login to Cloudflare**:

```sh
cloudflared login
```

Authenticate with your Cloudflare account in PowerShell.

1. **Start Tunnel**:

```sh
cloudflared tunnel --url http://localhost:3000
```

```sh
cloudflared tunnel --config C:\Users\DELL\Desktop\workspace\ComfyUI-Midware\config.yml run midware-tunnel```
Run the Cloudflare Tunnel command to generate a public URL for your local server.

## API Usage

### Available Endpoints

- **Style Transfer**: `/api/style_transfer`
- **Text to Portrait**: `/api/text_to_portrait`

### Example Request

#### Style Transfer

```sh
curl -X POST http://localhost:3000/api/style_transfer \
  -F "content=@path/to/content.jpg" \
  -F "style=@path/to/style.jpg" \
  -F "positivePrompt=positive prompt text" \
  -F "negativePrompt=negative prompt text"
```

#### Text to Portrait

```sh
curl -X POST http://localhost:3000/api/text_to_portrait \
  -F "text=a girl"
```

## Conclusion

This project demonstrates the application of multimodal AI in narrative game development, providing a comprehensive workflow and API tools to enhance game content generation. By leveraging large language models and text-to-image models, we aim to improve the efficiency and quality of game development, offering a valuable toolset for developers.
