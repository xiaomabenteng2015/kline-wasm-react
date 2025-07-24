// 专门用于模型选择功能的 Transformers.js 服务
// 动态导入 transformers.js 以避免 SSR 问题
let pipeline: any = null;
let env: any = null;

// 初始化 transformers.js 模块
async function initTransformersModule(loadType: "remote" | "local" = "remote") {
  if (typeof window === "undefined") {
    throw new Error("Transformers.js can only be used in browser environment");
  }

  if (!pipeline || !env) {
    const transformers = await import("@xenova/transformers");
    pipeline = transformers.pipeline;
    env = transformers.env;
  }

  // 根据加载类型配置 transformers.js
  if (loadType === "remote") {
    console.log("配置远程模型加载...");
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    // 设置缓存目录（可选）
    env.cacheDir = "./.cache/";
  } else {
    console.log("配置本地模型加载...");
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = "/models/";
  }

  // 设置 WASM 线程数
  env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
}

let textGenerator: any = null;
let isInitialized = false;
let isLoading = false;
let currentModelName = "";

// 预定义的模型列表
export const AVAILABLE_MODELS = [
  {
    id: "distilgpt2",
    name: "DistilGPT-2 (远程)",
    modelPath: "Xenova/distilgpt2",
    size: "",
    description: "超轻量级模型，从 Hugging Face 远程加载",
    conversationFormat: "simple",
    loadType: "remote" as const,
  },
  {
    id: "gpt2",
    name: "GPT-2 (远程)",
    modelPath: "Xenova/gpt2",
    size: "",
    description: "经典GPT-2模型，从 Hugging Face 远程加载",
    conversationFormat: "simple",
    loadType: "remote" as const,
  },
  {
    id: "tinyllama",
    name: "TinyLlama Chat (远程)",
    modelPath: "Xenova/TinyLlama-1.1B-Chat-v1.0",
    size: "",
    description: "小型LLaMA变体，从 Hugging Face 远程加载",
    conversationFormat: "chatml",
    loadType: "remote" as const,
  },
  {
    id: "phi2",
    name: "Phi-2 (远程)",
    modelPath: "Xenova/phi-2",
    size: "800MB",
    description: "微软的高质量小模型，推理能力强",
    conversationFormat: "simple",
    loadType: "remote" as const,
  },
  {
    id: "qwen-local",
    name: "Qwen 1.5 0.5B Chat (本地)",
    modelPath: "qwen1.5-0.5b-chat",
    size: "300MB",
    description: "阿里巴巴开源的对话模型（需要本地文件）",
    conversationFormat: "chatml",
    loadType: "local" as const,
  },
];

// 支持模型选择的初始化函数
export async function initModelSelectorService(
  modelId: string,
  onProgress?: (progress: number) => void
) {
  if (isLoading) return;

  // 如果已经初始化了相同的模型，直接返回
  if (isInitialized && currentModelName === modelId) return;

  // 如果要加载不同的模型，先清理当前模型
  if (isInitialized && currentModelName !== modelId) {
    cleanupModelSelectorService();
  }

  const selectedModel = AVAILABLE_MODELS.find((model) => model.id === modelId);
  if (!selectedModel) {
    throw new Error(`未找到模型: ${modelId}`);
  }

  try {
    isLoading = true;
    onProgress?.(5);

    // 根据模型类型初始化 transformers 模块
    await initTransformersModule(selectedModel.loadType);
    onProgress?.(10);

    console.log(
      `Initializing Model Selector service with model: ${selectedModel.name}...`
    );

    // 使用 transformers.js 加载选定的模型
    textGenerator = await pipeline("text-generation", selectedModel.modelPath, {
      progress_callback: (progress: any) => {
        // 将进度映射到 10-95% 范围，为最终验证留出空间
        const percentage = Math.round(progress.progress * 85) + 10;
        onProgress?.(percentage);
        console.log(`Loading progress: ${percentage}%`);
      },
    });

    // 验证模型是否真正可用
    if (textGenerator) {
      // 只有在这里才真正标记为初始化完成
      isInitialized = true;
      currentModelName = modelId;
      onProgress?.(100);
      console.log(
        `Model Selector service initialized successfully with model: ${selectedModel.name}`
      );
    } else {
      throw new Error("Model initialization failed: textGenerator is null");
    }
  } catch (error) {
    console.error("Failed to initialize model selector service:", error);
    isLoading = false;
    throw error;
  } finally {
    isLoading = false;
  }
}

// 根据模型类型构建对话格式
function buildConversation(
  prompt: string,
  history: Array<{ role: string; content: string }>,
  modelId: string
): string {
  const selectedModel = AVAILABLE_MODELS.find((model) => model.id === modelId);
  const format = selectedModel?.conversationFormat || "simple";

  let conversation = "";

  if (format === "chatml") {
    // ChatML 格式 (适用于 TinyLlama, Qwen 等)
    for (const msg of history) {
      if (msg.role === "user") {
        conversation += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
      } else {
        conversation += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
      }
    }
    conversation += `<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
  } else {
    // 简单格式 (适用于 GPT-2, DistilGPT-2 等)
    for (const msg of history) {
      if (msg.role === "user") {
        conversation += `Human: ${msg.content}\n`;
      } else {
        conversation += `AI: ${msg.content}\n`;
      }
    }
    conversation += `Human: ${prompt}\nAI:`;
  }

  return conversation;
}

// 生成响应
export async function generateModelSelectorResponse(
  prompt: string,
  history: Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void
) {
  if (!isInitialized || !textGenerator) {
    // 演示模式回退
    const demoResponses = [
      "我是基于 Transformers.js 的 AI 助手，很高兴为您服务！这是一个演示回复。",
      "Transformers.js 让在浏览器中运行 AI 模型变得更加简单和强大！",
      "这个模型选择器让您可以轻松对比不同模型的表现。",
    ];

    const response =
      demoResponses[Math.floor(Math.random() * demoResponses.length)];

    // 模拟流式输出
    for (let i = 0; i < response.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      onChunk(response[i]);
    }
    return;
  }

  try {
    // 根据当前模型构建对话格式
    const conversation = buildConversation(prompt, history, currentModelName);

    console.log(`Generating response with ${getCurrentModelInfo()?.name}...`);

    // 根据模型调整生成参数
    const generationParams = getGenerationParams(currentModelName);

    // 使用 transformers.js 生成
    const result = await textGenerator(conversation, generationParams);

    // 处理生成结果
    if (result && result[0]?.generated_text) {
      let generatedText = result[0].generated_text;

      // 清理输出文本（移除可能的格式标记）
      generatedText = cleanGeneratedText(generatedText, currentModelName);

      // 模拟流式输出
      for (let i = 0; i < generatedText.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        onChunk(generatedText[i]);
      }
    } else {
      // 如果没有生成文本，提供默认回复
      const fallbackResponse = "抱歉，我现在无法生成回复。请稍后再试。";
      for (let i = 0; i < fallbackResponse.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        onChunk(fallbackResponse[i]);
      }
    }
  } catch (error) {
    console.error("Generation failed:", error);

    // 错误回退
    const errorResponse = `抱歉，使用 ${
      getCurrentModelInfo()?.name || "当前模型"
    } 生成响应时出现了错误。`;
    for (let i = 0; i < errorResponse.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      onChunk(errorResponse[i]);
    }
  }
}

// 根据模型获取生成参数
function getGenerationParams(modelId: string) {
  const baseParams = {
    do_sample: true,
    return_full_text: false,
  };

  switch (modelId) {
    case "distilgpt2":
    case "gpt2":
      return {
        ...baseParams,
        max_new_tokens: 80,
        temperature: 0.8,
        top_p: 0.9,
        repetition_penalty: 1.1,
      };
    case "tinyllama":
      return {
        ...baseParams,
        max_new_tokens: 100,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.05,
      };
    case "phi2":
      return {
        ...baseParams,
        max_new_tokens: 150,
        temperature: 0.6,
        top_p: 0.85,
        repetition_penalty: 1.1,
      };
    case "qwen-local":
      return {
        ...baseParams,
        max_new_tokens: 120,
        temperature: 0.7,
        top_p: 0.8,
        repetition_penalty: 1.1,
      };
    default:
      return {
        ...baseParams,
        max_new_tokens: 80,
        temperature: 0.7,
        top_p: 0.9,
      };
  }
}

// 清理生成的文本
function cleanGeneratedText(text: string, modelId: string): string {
  let cleaned = text;

  // 移除可能的格式标记
  cleaned = cleaned.replace(/<\|im_end\|>/g, "");
  cleaned = cleaned.replace(/<\|im_start\|>/g, "");
  cleaned = cleaned.replace(/Human:/g, "");
  cleaned = cleaned.replace(/AI:/g, "");

  // 移除多余的换行和空格
  cleaned = cleaned.trim();

  // 如果文本为空，返回默认消息
  if (!cleaned) {
    return "我理解了您的问题，但现在无法提供合适的回复。";
  }

  return cleaned;
}

// 获取当前模型信息
export function getCurrentModelInfo() {
  return AVAILABLE_MODELS.find((model) => model.id === currentModelName);
}

// 检查服务状态
export function isModelSelectorServiceReady(): boolean {
  return isInitialized && textGenerator !== null;
}

export function isModelSelectorServiceLoading(): boolean {
  return isLoading;
}

export function getCurrentModelName(): string {
  return currentModelName;
}

// 清理服务
export function cleanupModelSelectorService() {
  textGenerator = null;
  isInitialized = false;
  isLoading = false;
  currentModelName = "";
  console.log("Model Selector service cleaned up");
}

// 获取模型统计信息
export function getModelStats() {
  return {
    currentModel: getCurrentModelInfo(),
    isReady: isModelSelectorServiceReady(),
    isLoading: isModelSelectorServiceLoading(),
  };
}

// 辅助函数：构建模型文件的完整 URL（仅用于演示）
export function buildModelUrls(modelPath: string) {
  const baseUrl = `https://huggingface.co/${modelPath}/resolve/main`;

  return {
    // 主要模型文件
    model: `${baseUrl}/onnx/model.onnx`,
    modelQuantized: `${baseUrl}/onnx/model_quantized.onnx`,

    // 分词器文件
    tokenizer: `${baseUrl}/tokenizer.json`,
    tokenizerConfig: `${baseUrl}/tokenizer_config.json`,

    // 配置文件
    config: `${baseUrl}/config.json`,

    // 其他可能的文件
    vocab: `${baseUrl}/vocab.json`,
    merges: `${baseUrl}/merges.txt`,

    // 模型仓库主页
    repoUrl: `https://huggingface.co/${modelPath}`,
  };
}

// 获取当前模型的所有 URL
export function getCurrentModelUrls() {
  const currentModel = getCurrentModelInfo();
  if (!currentModel) return null;

  return buildModelUrls(currentModel.modelPath);
}
