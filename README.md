# K 线 WASM 演示项目

一个集成了加密货币 K 线图表分析和多种 AI 聊天功能的 Next.js 应用程序，展示了在浏览器中使用 WebAssembly (WASM) 技术运行机器学习模型的能力。

## 🎯 项目概述

本项目是一个综合性的演示应用，展示了在浏览器中运行多种 AI 模型的能力，主要功能包括：

- **加密货币 K 线图表**：实时获取和展示币安交易数据
- **多种 AI 聊天服务**：WebLLM、ONNX Runtime、Transformers.js
- **模型选择器**：支持远程和本地模型加载
- **HTTPS 支持**：自定义证书配置
- **Service Worker 集成**：离线缓存和后台处理
- **响应式设计**：适配多种设备和屏幕尺寸

## ✨ 项目特色

### 🌐 浏览器端 AI 推理

- **零服务器依赖**: 所有 AI 模型直接在浏览器中运行
- **隐私保护**: 数据不离开用户设备
- **离线可用**: 模型下载后可离线使用

### 🔄 多技术栈支持

- **WebLLM**: 基于 WebGPU 的高性能大语言模型
- **ONNX Runtime**: 跨平台机器学习推理
- **Transformers.js**: Hugging Face 生态系统
- **TensorFlow.js**: 谷歌机器学习框架

### 📊 实时数据可视化

- **K 线图表**: 使用 lightweight-charts 展示交易数据
- **实时更新**: 支持 WebSocket 连接实时数据
- **交互式图表**: 缩放、平移、指标分析

### 🎛️ 灵活的模型管理

- **动态加载**: 运行时切换不同 AI 模型
- **进度显示**: 实时显示模型下载和加载进度
- **错误恢复**: 优雅处理模型加载失败

## 🏗️ 技术架构

### 前端框架

- **Next.js 15.4.2** - React 全栈框架，支持 SSR 和静态生成
- **React 19.1.0** - 用户界面库，使用最新的并发特性
- **TypeScript 5+** - 类型安全的 JavaScript，提供完整的类型检查

### AI/ML 技术栈

- **@mlc-ai/web-llm** - 浏览器中的大语言模型，支持 WebGPU 加速
- **onnxruntime-web** - ONNX 模型推理引擎，支持 WebGL 和 CPU 后端
- **@huggingface/transformers** - Hugging Face Transformers 的 JavaScript 版本
- **@tensorflow/tfjs** + **@tensorflow/tfjs-backend-wasm** - TensorFlow.js WASM 后端

### 数据可视化

- **lightweight-charts** - 高性能 K 线图表库，支持实时数据更新

### 架构设计原则

#### 1. 模块化设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │    Services     │    │   Data Layer    │
│                 │    │                 │    │                 │
│ • Chat Interface│◄──►│ • AI Services   │◄──►│ • Model Cache   │
│ • Chart Display │    │ • Data Services │    │ • API Clients   │
│ • Model Selector│    │ • Cache Service │    │ • WebSocket     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 2. 服务层抽象

- **统一接口**: 所有 AI 服务实现相同的接口规范
- **错误处理**: 统一的错误处理和降级策略
- **状态管理**: 集中管理模型加载和运行状态

#### 3. 性能优化策略

- **懒加载**: 按需加载模型和组件
- **缓存机制**: 多层缓存策略（浏览器、Service Worker、内存）
- **并发控制**: 防止同时加载多个大模型
- **内存管理**: 自动清理不用的模型实例

## 📁 项目结构

```
kline-wasm-demo/
├── app/
│   ├── components/           # 通用组件
│   │   ├── Navbar.tsx       # 导航栏组件
│   │   └── ServiceWorkerProvider.tsx  # Service Worker提供者
│   ├── hooks/               # React Hooks
│   │   └── useKlineData.ts  # K线数据Hook
│   ├── lib/                 # 工具库
│   │   └── klineUtils.ts    # K线数据生成工具
│   ├── services/            # 服务层
│   │   ├── binanceService.ts           # 币安API服务
│   │   ├── cacheService.ts             # 缓存服务
│   │   ├── diagnostics.ts              # 诊断服务
│   │   ├── fallbackChatService.ts     # 备用聊天服务
│   │   ├── fastChatService.ts         # 快速聊天服务
│   │   ├── inferenceService.ts        # 推理服务
│   │   ├── llmService.ts               # WebLLM服务
│   │   ├── onnxService.ts              # ONNX推理服务
│   │   ├── swManager.ts                # Service Worker管理
│   │   ├── transformersService.ts     # Transformers.js服务
│   │   ├── transformersModelSelectorService.ts  # 模型选择服务
│   │   └── websocketManager.ts        # WebSocket管理
│   ├── views/               # 页面视图
│   │   ├── ai/              # WebLLM聊天页面
│   │   ├── fast-chat/       # 快速聊天页面
│   │   ├── kline-system/    # K线系统页面
│   │   ├── onnx-chat/       # ONNX聊天页面
│   │   ├── transformers-chat/  # Transformers聊天页面
│   │   └── transformers-chat-with-selector/  # 模型选择聊天页面
│   └── styles/              # 样式文件
├── public/
│   ├── models/              # 本地模型文件目录
│   ├── onnxruntime/         # ONNX Runtime WASM文件
│   ├── tfjs-backend-wasm/   # TensorFlow.js WASM后端
│   ├── workers/             # Web Workers
│   └── sw.js                # Service Worker
└── scripts/                 # 脚本目录（当前为空）
```

## 🔧 核心模块详解

### 0. 服务架构概览

项目采用模块化服务架构，主要包括：

- **数据服务层**: `binanceService.ts`, `cacheService.ts`
- **AI 推理层**: `llmService.ts`, `onnxService.ts`, `transformersService.ts`
- **模型管理层**: `transformersModelSelectorService.ts`
- **通信层**: `websocketManager.ts`, `swManager.ts`
- **诊断层**: `diagnostics.ts`

### 1. K 线数据服务 (`binanceService.ts`)

**功能**：从币安 API 获取历史 K 线数据

**核心函数**：

```typescript
async function fetchHistoricalKlines(
  symbol: string = "BTCUSDT",
  interval: KlineInterval = KlineInterval.ONE_DAY,
  limit: number = 500
): Promise<BinanceKline[]>;
```

**技术实现**：

- 直接调用币安公开 API
- 数据格式转换（毫秒 → 秒时间戳）
- 带重试机制的网络请求
- 支持多种交易对和时间间隔

**数据流**：

```
币安API → fetchWithRetry → 数据转换 → BinanceKline[]
```

### 2. WebLLM 服务 (`llmService.ts`)

**功能**：使用 MLC AI 的 WebLLM 在浏览器中运行大语言模型

**核心功能**：

- `initLLMService`：WebLLM 引擎初始化
- `loadModel`：模型加载管理
- `generateResponse`：流式文本生成
- `isModelLoaded`：模型状态检查

**使用的模型**：

- **Qwen2-1.5B-Instruct-q4f16_1-MLC** - 阿里巴巴通义千问模型的量化版本

**技术实现**：

```typescript
// 初始化WebLLM引擎
const webllmModule = await import("@mlc-ai/web-llm");
webllm = await webllmModule.CreateMLCEngine(MODEL_CONFIG.modelId, {
  initProgressCallback: (report: any) => {
    console.log(`初始化进度: ${(report.progress * 100).toFixed(1)}%`);
  },
});

// 使用OpenAI兼容的API进行对话
const completion = await webllm.chat.completions.create({
  messages: messages,
  temperature: 0.7,
  max_tokens: 512,
  stream: true,
});
```

**技术特性**：

- **WebGPU 加速**：利用 GPU 进行高性能推理
- **流式输出**：实时生成响应内容
- **OpenAI 兼容 API**：支持标准的 chat.completions 接口
- **浏览器缓存**：模型文件自动缓存，提升后续加载速度
- **环境检测**：自动检测浏览器兼容性和安全上下文

**环境要求**：

- HTTPS 协议（安全上下文）
- 支持 WebGPU 的现代浏览器
- SharedArrayBuffer 支持
- 足够的内存空间（推荐 8GB+）

### 3. ONNX 推理服务 (`onnxService.ts`)

**功能**：使用 ONNX Runtime 在浏览器中运行 AI 模型

**核心组件**：

- `SimpleTokenizer`：自定义分词器
- `initOnnxService`：服务初始化
- `generateOnnxResponse`：文本生成
- `sampleToken`：Token 采样算法

**技术实现**：

```typescript
// 初始化ONNX推理会话
session = await InferenceSession.create(MODEL_CONFIG.modelPath, {
  executionProviders: ["webgl", "cpu"],
  graphOptimizationLevel: "all",
});

// Token采样（Temperature + Top-p）
function sampleToken(logits: Tensor, temperature: number, topP: number): number;
```

**特性**：

- WebGL/CPU 双后端支持
- 自定义分词器实现
- 高级采样策略（Temperature、Top-p）
- 演示模式回退机制

### 4. Transformers.js 服务 (`transformersModelSelectorService.ts`)

**功能**：支持多模型选择的 Transformers.js 服务

**支持的模型**：

- **DistilGPT-2** (远程) - 超轻量级，从 Hugging Face 远程加载
- **GPT-2** (远程) - 经典模型，从 Hugging Face 远程加载
- **TinyLlama Chat** (远程) - 小型 LLaMA 变体，对话优化
- **Phi-3 Mini 4K Instruct** (远程/本地) - 微软高质量指令跟随模型
- **Qwen 1.5 0.5B Chat** (本地) - 阿里巴巴开源对话模型

**核心功能**：

```typescript
// 动态配置加载方式
async function initTransformersModule(loadType: "remote" | "local");

// 智能对话格式构建
function buildConversation(prompt: string, history: Array, modelId: string);

// 模型特定的生成参数
function getGenerationParams(modelId: string);

// 模型URL构建（用于调试）
function buildModelUrls(modelPath: string);

// 状态管理
function isModelSelectorServiceReady(): boolean;
function getCurrentModelInfo(): ModelInfo;
```

**技术特性**：

- **远程加载**：直接从 Hugging Face Hub 下载
- **本地加载**：使用预下载的模型文件
- **智能格式化**：支持 ChatML 和 Simple 两种对话格式
- **参数优化**：每个模型专门调优的生成参数
- **URL 调试**：提供模型文件 URL 构建和验证功能
- **状态管理**：完整的加载状态和错误处理
- **模型切换**：运行时动态切换不同模型

### 5. 备用聊天服务 (`fallbackChatService.ts`)

**功能**：基于关键词匹配的备用聊天系统

**实现机制**：

```typescript
// 关键词规则匹配
for (const rule of KEYWORD_RULES) {
  if (rule.keywords.some((keyword) => lowerPrompt.includes(keyword))) {
    category = rule.category;
    break;
  }
}

// 流式输出模拟
const words = fullResponse.split("");
for (let i = 0; i < words.length; i++) {
  await new Promise((resolve) => setTimeout(resolve, 20));
  onChunk(words[i]);
}
```

**特性**：

- 关键词分类系统
- 投资免责声明
- 流式输出模拟
- 多语言支持

### 6. K 线数据工具 (`klineUtils.ts`)

**功能**：生成模拟 K 线数据用于测试

```typescript
export function generateKlineData(count = 1000) {
  // 生成随机价格走势
  // 支持自定义数据量
  // 时间戳格式兼容lightweight-charts
}
```

### 7. 其他核心服务

**缓存服务** (`cacheService.ts`)：

- 模型文件缓存管理
- 浏览器存储优化
- 缓存清理和更新

**诊断服务** (`diagnostics.ts`)：

- 系统性能监控
- 模型加载诊断
- 错误日志收集

**WebSocket 管理** (`websocketManager.ts`)：

- 实时数据连接
- 连接状态管理
- 自动重连机制

**Service Worker 管理** (`swManager.ts`)：

- 离线功能支持
- 资源缓存策略
- 后台任务处理

## 🎨 用户界面组件

### 1. 模型选择器 (`ModelSelector.tsx`)

**功能**：

- 展示可用模型列表
- 显示模型大小和加载类型
- 支持远程/本地模型标识
- 响应式设计

**视觉特性**：

- 绿色标签：远程模型
- 黄色标签：本地模型
- 模型大小显示
- 选择状态高亮

### 2. 消息输入组件 (`MessageInput.tsx`)

**功能**：

- 自适应高度文本框
- Enter 发送，Shift+Enter 换行
- 发送状态管理
- 表单验证

### 3. 模型 URL 调试器 (`ModelUrlDebugger.tsx`)

**功能**：

- 显示模型的完整 URL 结构
- 验证文件可访问性
- 帮助理解 Transformers.js 下载机制
- 实时检查模型文件状态

**调试信息包括**：

- 模型主文件 URL
- 分词器配置文件
- 模型配置文件
- Hugging Face 仓库链接

## 🚀 部署和使用

### 环境要求

- **Node.js 18+** - 运行环境
- **现代浏览器** - 支持 WebAssembly、WebGPU（可选）
- **HTTPS 环境** - WebLLM 和某些 WASM 功能需要
- **内存要求** - 推荐 8GB+ RAM（大模型需要）
- **网络连接** - 远程模型需要稳定网络

### 快速开始

#### 📋 预检查清单

在开始之前，请确认：

- [ ] Node.js 18+ 已安装
- [ ] 浏览器支持 WebAssembly
- [ ] 网络连接稳定（用于下载模型）
- [ ] 可用内存 ≥ 8GB（推荐）

#### 🚀 启动步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd kline-wasm-demo
```

2. **安装依赖**

```bash
npm install
```

3. **开发模式**

```bash
# HTTP开发服务器（端口3000）
npm run dev

# HTTPS开发服务器（端口3001，推荐）
npm run dev:https
```

4. **生产部署**

```bash
npm run build
npm run start

# 或HTTPS模式
npm run start:https
```

### 可用脚本

```bash
# 开发相关
npm run dev          # HTTP开发服务器 (端口3000)
npm run dev:https    # HTTPS开发服务器 (端口3001)

# 构建和部署
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run start:https  # 启动HTTPS生产服务器

# 代码质量
npm run lint         # ESLint代码检查
```

### 页面导航

项目包含以下主要页面：

- **首页** (`/`) - 项目介绍和功能概览
- **K 线推理系统** (`/views/kline-system`) - 完整的机器学习工作流程
- **WebLLM 聊天** (`/views/ai`) - 基于 WebLLM 的浏览器端 AI 对话
- **快速聊天测试** (`/views/fast-chat`) - 快速聊天功能测试
- **ONNX 聊天** (`/views/onnx-chat`) - 基于 ONNX Runtime 的高性能聊天
- **Transformers 聊天** (`/views/transformers-chat`) - 基于 Transformers.js 的聊天
- **模型选择聊天** (`/views/transformers-chat-with-selector`) - 支持多模型选择的聊天界面
- **ONNX 聊天** (`/views/onnx-chat`) - ONNX 模型推理聊天
- **Transformers 聊天** (`/views/transformers-chat`) - Transformers.js 聊天
- **模型选择聊天** (`/views/transformers-chat-with-selector`) - 多模型选择对话

### 模型文件准备

项目支持两种模型加载方式：

**远程模型**（推荐新手）：

- 无需预下载，直接从 Hugging Face Hub 加载
- 首次使用需要网络连接
- 模型会自动缓存到浏览器

**本地模型**（适合离线使用）：

1. 创建 `public/models/` 目录
2. 从 Hugging Face 下载对应模型文件：
   - [Phi-3 Mini 4K Instruct](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx)
   - [Qwen 1.5 0.5B Chat](https://huggingface.co/Qwen/Qwen1.5-0.5B-Chat)
3. 将模型文件放置在对应的子目录中

**目录结构示例**：

```
public/models/
├── phi3-mini-4k-instruct_fp16/
│   ├── config.json
│   ├── tokenizer.json
│   └── onnx/model.onnx
└── qwen1.5-0.5b-chat/
    ├── config.json
    ├── tokenizer.json
    └── onnx/model.onnx
```

## 🔄 数据流和架构

### AI 聊天数据流

```
用户输入 → 服务选择 → 模型加载 → 推理执行 → 流式输出 → 用户界面
```

### K 线数据流

```
币安API → 数据获取 → 格式转换 → 图表渲染 → 用户交互
```

### 模型加载流程

```
模型选择 → 配置检查 → 文件下载/加载 → 初始化 → 就绪状态
```

## ✨ 项目特色功能

### 1. 多 AI 引擎集成

- **WebLLM**: 基于 WebGPU 的高性能大语言模型
- **ONNX Runtime**: 跨平台机器学习推理
- **Transformers.js**: Hugging Face 生态系统集成
- **备用聊天**: 关键词匹配的离线聊天

### 2. 智能模型管理

- 远程模型自动下载和缓存
- 本地模型文件支持
- 运行时模型切换
- 模型 URL 调试工具

### 3. 金融数据可视化

- 实时 K 线图表展示
- 币安 API 数据集成
- 交互式图表操作
- 多时间周期支持

### 4. 开发者友好

- 完整的 TypeScript 支持
- 模块化架构设计
- 详细的错误处理
- 性能监控和诊断

## 🎯 技术亮点

### 1. WebAssembly 集成

- **ONNX Runtime Web**：高性能模型推理
- **TensorFlow.js WASM**：加速计算
- **Transformers.js**：完整的 NLP pipeline

### 2. 多模型支持

- 远程模型：无需预下载，直接使用
- 本地模型：离线使用，隐私保护
- 动态切换：运行时模型切换

### 3. 性能优化

- 模型缓存：避免重复下载
- 流式输出：实时响应体验
- 懒加载：按需加载模型

### 4. 用户体验

- 进度显示：模型加载进度
- 错误处理：优雅的错误恢复
- 响应式设计：多设备适配

## 🔧 配置选项

### HTTPS 配置

```javascript
// server.js
const certFile = "10.20.10.43+2.pem"; // SSL 证书文件
const keyFile = "10.20.10.43+2-key.pem"; // SSL 私钥文件
const port = process.env.PORT || 3001; // HTTPS 端口
```

### 模型配置

```typescript
// transformersModelSelectorService.ts
export const AVAILABLE_MODELS = [
  {
    id: "distilgpt2",
    name: "DistilGPT-2 (远程)",
    modelPath: "Xenova/distilgpt2",
    size: "82MB",
    loadType: "remote",
    description: "轻量级模型，适合快速测试",
  },
  {
    id: "gpt2",
    name: "GPT-2 (远程)",
    modelPath: "Xenova/gpt2",
    size: "124MB",
    loadType: "remote",
    description: "经典 GPT-2 模型",
  },
  // ... 更多模型
];
```

### WebLLM 配置

```typescript
// llmService.ts
const MODEL_CONFIG = {
  modelId: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
  temperature: 0.7,
  max_tokens: 512,
  top_p: 0.9,
};
```

### ONNX 配置

```typescript
// onnxService.ts
const MODEL_CONFIG = {
  modelPath: "/models/phi3-mini-4k-instruct.onnx",
  executionProviders: ["webgl", "cpu"],
  graphOptimizationLevel: "all",
};
```

### Next.js 配置

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@huggingface/transformers"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};
```

## 🌐 浏览器兼容性

### 支持的浏览器

| 浏览器  | 最低版本 | WebLLM | ONNX | Transformers.js | 备注               |
| ------- | -------- | ------ | ---- | --------------- | ------------------ |
| Chrome  | 88+      | ✅     | ✅   | ✅              | 推荐使用，完整支持 |
| Firefox | 89+      | ⚠️     | ✅   | ✅              | WebLLM 支持有限    |
| Safari  | 15.2+    | ❌     | ✅   | ✅              | 不支持 WebLLM      |
| Edge    | 88+      | ✅     | ✅   | ✅              | 基于 Chromium      |

### 功能要求

- **WebAssembly**: 所有现代浏览器都支持
- **SharedArrayBuffer**: 需要安全上下文 (HTTPS)
- **WebGPU**: WebLLM 需要，Chrome 113+ 完整支持
- **Service Worker**: 缓存和离线功能需要

### 推荐配置

- **Chrome 120+** + **HTTPS** + **8GB+ RAM** = 最佳体验
- 启用硬件加速以获得更好的性能
- 确保浏览器允许 SharedArrayBuffer

## 🐛 故障排除

### 常见问题

1. **模型加载失败**

   - 检查网络连接和防火墙设置
   - 验证 Hugging Face 模型 URL 可访问性
   - 查看浏览器控制台错误信息
   - 尝试切换到其他模型

2. **HTTPS 证书问题**

   - 更新 `10.20.10.43+2.pem` 和 `10.20.10.43+2-key.pem` 证书文件
   - 检查证书有效期和域名匹配
   - 配置防火墙规则允许 3001 端口

3. **内存不足错误**

   - 选择更小的模型（如 DistilGPT-2）
   - 关闭其他浏览器标签页
   - 重启浏览器清理内存
   - 使用量化版本的模型

4. **WebLLM 初始化失败**

   - 确保使用 HTTPS 协议访问
   - 检查浏览器是否支持 WebGPU
   - 验证 SharedArrayBuffer 支持
   - 尝试在隐私模式下测试

5. **Transformers.js 加载慢**
   - 首次加载需要下载模型，请耐心等待
   - 检查网络连接稳定性
   - 考虑使用本地模型文件
   - 清理浏览器缓存后重试

### 调试技巧

- 打开浏览器开发者工具查看详细错误
- 检查网络面板了解模型下载进度
- 使用模型选择器的 URL 调试功能
- 查看控制台的详细日志信息

## 📈 性能指标

### 模型对比

| 模型           | 加载方式  | 特点                  | 推荐场景 | 对话格式 |
| -------------- | --------- | --------------------- | -------- | -------- |
| DistilGPT-2    | 远程      | 超轻量级，快速加载    | 入门测试 | Simple   |
| GPT-2          | 远程      | 经典模型，平衡性能    | 一般对话 | Simple   |
| TinyLlama Chat | 远程      | 对话优化，ChatML 格式 | 聊天应用 | ChatML   |
| Phi-3 Mini     | 远程/本地 | 高质量指令跟随        | 专业应用 | ChatML   |
| Qwen 1.5 0.5B  | 本地      | 中文优化，需预下载    | 中文对话 | ChatML   |

### 性能参数配置

每个模型都有专门优化的生成参数：

- **DistilGPT-2/GPT-2**: `max_tokens: 80, temperature: 0.8, top_p: 0.9`
- **TinyLlama**: `max_tokens: 100, temperature: 0.7, top_p: 0.9`
- **Phi-3 Mini**: `max_tokens: 150, temperature: 0.6, top_p: 0.85`
- **Qwen**: `max_tokens: 120, temperature: 0.7, top_p: 0.8`

### 加载时间估算

| 网络速度            | 远程模型     | 本地模型 |
| ------------------- | ------------ | -------- |
| 快速网络 (>10Mbps)  | 30 秒-2 分钟 | 5-15 秒  |
| 普通网络 (1-10Mbps) | 2-5 分钟     | 5-15 秒  |
| 慢速网络 (<1Mbps)   | 5-10 分钟    | 5-15 秒  |

### 浏览器兼容性

| 功能            | Chrome | Firefox | Safari | Edge |
| --------------- | ------ | ------- | ------ | ---- |
| Transformers.js | ✅     | ✅      | ✅     | ✅   |
| ONNX Runtime    | ✅     | ✅      | ⚠️     | ✅   |
| WebLLM          | ✅     | ⚠️      | ❌     | ✅   |

- ✅ 完全支持
- ⚠️ 部分支持或需要特定设置
- ❌ 不支持

## � 项目特色功能

### 1. 智能模型选择器

- 支持远程和本地模型切换
- 实时显示模型大小和加载状态
- 自动检测模型可用性

### 2. 流式响应体验

- 所有 AI 服务都支持流式输出
- 实时显示生成进度
- 优雅的错误处理和回退机制

### 3. 多技术栈集成

- **WebLLM**: 浏览器端大语言模型
- **ONNX Runtime**: 高性能推理引擎
- **Transformers.js**: Hugging Face 生态系统
- **TensorFlow.js**: 机器学习框架

### 4. 生产级特性

- Service Worker 缓存策略
- 离线模式支持
- 错误边界和降级处理
- 性能监控和诊断

## 🛠️ 开发指南

### 添加新的 AI 服务

1. **创建服务文件**:

   ```typescript
   // app/services/newAIService.ts
   export async function initNewAIService() {
     // 初始化逻辑
   }

   export async function generateResponse(prompt: string) {
     // 生成逻辑
   }
   ```

2. **添加到页面**:

   ```typescript
   // app/views/new-ai-chat/page.tsx
   import { initNewAIService, generateResponse } from "@/services/newAIService";
   ```

3. **更新导航**:
   ```typescript
   // app/components/Navbar.tsx
   // 添加新的导航链接
   ```

### 添加新模型

1. **更新模型配置**:

   ```typescript
   // transformersModelSelectorService.ts
   export const AVAILABLE_MODELS = [
     // ... 现有模型
     {
       id: "new-model",
       name: "新模型名称",
       modelPath: "huggingface/model-path",
       size: "模型大小",
       loadType: "remote" | "local",
     },
   ];
   ```

2. **添加模型特定配置**:
   ```typescript
   function getGenerationParams(modelId: string) {
     switch (modelId) {
       case "new-model":
         return { max_new_tokens: 100, temperature: 0.8 };
       // ...
     }
   }
   ```

### API 参考

#### 核心服务接口

```typescript
// 通用 AI 服务接口
interface AIService {
  init(onProgress?: (progress: number) => void): Promise<void>;
  generateResponse(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void
  ): Promise<void>;
  isReady(): boolean;
  cleanup(): void;
}

// 模型配置接口
interface ModelConfig {
  id: string;
  name: string;
  modelPath: string;
  size: string;
  loadType: "remote" | "local";
  description?: string;
}
```

#### 工具函数

```typescript
// K线数据生成
export function generateKlineData(count?: number): KlineData[];

// 缓存管理
export class CacheService {
  static set(key: string, value: any): void;
  static get(key: string): any;
  static clear(): void;
}
```

## 🤝 贡献指南

### 开发流程

1. **Fork 项目**

   ```bash
   git clone https://github.com/your-username/kline-wasm-demo.git
   cd kline-wasm-demo
   ```

2. **创建功能分支**

   ```bash
   git checkout -b feature/new-feature
   ```

3. **开发和测试**

   ```bash
   npm install
   npm run dev:https
   # 进行开发和测试
   ```

4. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   git push origin feature/new-feature
   ```

5. **发起 Pull Request**
   - 描述更改内容
   - 添加测试截图
   - 确保代码通过 lint 检查

### 代码规范

- 使用 TypeScript 进行类型安全
- 遵循 ESLint 配置
- 组件使用函数式组件和 Hooks
- 服务层使用 async/await
- 添加适当的错误处理和日志

## 📝 更新日志

### v0.1.0 (当前版本)

#### ✨ 新功能

- 集成 WebLLM、ONNX Runtime、Transformers.js 三种 AI 技术栈
- 支持多种 AI 模型的动态加载和切换
- 实现币安 API K 线数据获取和可视化
- 添加 HTTPS 开发服务器支持
- 实现 Service Worker 缓存机制

#### 🔧 技术特性

- Next.js 15.4.2 + React 19.1.0
- TypeScript 5+ 完整类型支持
- 响应式设计，支持多设备
- 模块化架构，易于扩展

#### 📦 包含的 AI 模型

- Qwen2-1.5B-Instruct (WebLLM)
- DistilGPT-2, GPT-2 (Transformers.js)
- TinyLlama, Phi-2 (可选)
- 自定义 ONNX 模型支持

#### 🐛 已知问题

- WebLLM 仅支持 Chrome/Edge 浏览器
- 大模型首次加载时间较长
- 需要 HTTPS 环境才能使用全部功能

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 🙏 致谢

- [Hugging Face](https://huggingface.co/) - 模型和 Transformers.js
- [Microsoft](https://github.com/microsoft/onnxruntime) - ONNX Runtime
- [MLC AI](https://github.com/mlc-ai/web-llm) - WebLLM
- [TradingView](https://github.com/tradingview/lightweight-charts) - Lightweight Charts
- [币安](https://binance-docs.github.io/apidocs/) - 公开 API

## 🔍 功能页面导航

本项目包含以下功能页面，可通过导航栏访问：

| 页面路径                                 | 功能描述             | 技术栈                    |
| ---------------------------------------- | -------------------- | ------------------------- |
| `/`                                      | 项目首页和功能概览   | Next.js                   |
| `/views/kline-system`                    | K 线推理模型系统     | TensorFlow.js + 币安 API  |
| `/views/ai`                              | WebLLM 聊天界面      | @mlc-ai/web-llm           |
| `/views/fast-chat`                       | 快速聊天测试         | 关键词匹配                |
| `/views/onnx-chat`                       | ONNX 模型聊天        | onnxruntime-web           |
| `/views/transformers-chat`               | Transformers.js 聊天 | @huggingface/transformers |
| `/views/transformers-chat-with-selector` | 多模型选择聊天       | @huggingface/transformers |

## 📊 项目依赖分析

### 核心依赖

```json
{
  "@huggingface/transformers": "^3.7.0", // Hugging Face 模型
  "@mlc-ai/web-llm": "^0.2.79", // WebLLM 引擎
  "@tensorflow/tfjs": "^4.22.0", // TensorFlow.js
  "onnxruntime-web": "^1.22.0", // ONNX Runtime
  "lightweight-charts": "^4.2.3", // K线图表
  "next": "15.4.2", // Next.js 框架
  "react": "19.1.0" // React 库
}
```

### 开发依赖

- TypeScript 5+ 用于类型安全
- ESLint 用于代码规范
- Next.js 内置的开发工具

## 🛠️ 开发指南

### 添加新的 AI 模型

1. **Transformers.js 模型**：

   - 在 `transformersModelSelectorService.ts` 中添加模型配置
   - 更新 `AVAILABLE_MODELS` 数组
   - 配置模型特定的生成参数

2. **ONNX 模型**：

   - 将模型文件放置在 `public/models/` 目录
   - 更新 `onnxService.ts` 中的模型路径
   - 调整分词器配置（如需要）

3. **WebLLM 模型**：
   - 更新 `llmService.ts` 中的 `MODEL_CONFIG`
   - 确保模型支持 MLC 格式

### 自定义样式

项目使用 CSS Modules，样式文件位于：

- `app/styles/` - 全局样式
- 各组件目录下的 `.module.css` 文件

### 添加新页面

1. 在 `app/views/` 下创建新目录
2. 添加 `page.tsx` 文件
3. 更新 `app/components/Navbar.tsx` 添加导航链接

## 🔧 配置说明

### HTTPS 证书配置

项目包含自签名证书文件：

- `10.20.10.43+2.pem` - 证书文件
- `10.20.10.43+2-key.pem` - 私钥文件

**生产环境请替换为有效证书！**

### 模型存储配置

- **远程模型**: 自动从 Hugging Face Hub 下载
- **本地模型**: 存储在 `public/models/` 目录
- **缓存**: 浏览器自动缓存已下载的模型

## ⚠️ 已知限制和注意事项

### 当前项目状态

1. **证书配置**: 使用的是自签名证书，生产环境需要替换
2. **模型文件**: 部分模型需要手动下载到 `public/models/` 目录

### 浏览器兼容性限制

| 功能              | Chrome      | Firefox     | Safari      | Edge        |
| ----------------- | ----------- | ----------- | ----------- | ----------- |
| WebLLM (WebGPU)   | ✅ 88+      | ❌ 不支持   | ❌ 不支持   | ✅ 88+      |
| ONNX Runtime      | ✅ 88+      | ✅ 89+      | ✅ 15.2+    | ✅ 88+      |
| Transformers.js   | ✅ 88+      | ✅ 89+      | ✅ 15.2+    | ✅ 88+      |
| SharedArrayBuffer | ✅ 需 HTTPS | ✅ 需 HTTPS | ✅ 需 HTTPS | ✅ 需 HTTPS |

### 性能考虑

- **内存使用**: 大模型可能占用 2-4GB 内存
- **加载时间**: 首次下载模型可能需要 5-15 分钟
- **CPU 使用**: 推理过程会占用大量 CPU 资源

## 🐛 常见问题解决

### 1. 模型加载失败

**问题**: 模型下载或加载失败
**解决方案**:

```bash
# 检查网络连接
curl -I https://huggingface.co

# 清除浏览器缓存
# 开发者工具 > Application > Storage > Clear storage

# 检查控制台错误信息
```

### 2. HTTPS 相关错误

**问题**: WebLLM 或某些功能无法使用
**解决方案**:

```bash
# 使用 HTTPS 开发服务器
npm run dev:https

# 或在浏览器中信任自签名证书
```

### 3. 内存不足

**问题**: 大模型加载导致页面崩溃
**解决方案**:

- 选择更小的模型（如 DistilGPT-2）
- 关闭其他浏览器标签页
- 增加系统内存

### 4. TypeScript 错误

**问题**: 类型检查失败
**解决方案**:

```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查 TypeScript 配置
npx tsc --noEmit
```

## 📈 性能优化建议

1. **模型选择**: 根据设备性能选择合适大小的模型
2. **缓存策略**: 利用浏览器缓存减少重复下载
3. **懒加载**: 按需加载模型和组件
4. **Web Workers**: 将计算密集型任务移至 Worker 线程
5. **内存管理**: 及时清理不用的模型实例

---

**注意**：本项目仅用于技术演示和学习目的，不构成任何投资建议。使用 AI 生成的内容时请谨慎判断。
