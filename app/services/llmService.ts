/**
 * LLM服务 - 管理WebLLM模型加载和推理
 */
import { Message } from "../ai/components/ChatInterface";
import {
  generateFallbackResponse,
  shouldUseFallback,
} from "./fallbackChatService";

// 模型配置
const MODEL_CONFIG = {
  modelId: "Qwen2-1.5B-Instruct-q4f16_1-MLC", // 使用Qwen2-1.5B模型
  quantized: true,
};

// 模块级变量
let webllm: any = null;
let isInitialized = false;
let isLoading = false;
let useFallback = false;

// 初始化LLM服务
export async function initLLMService(): Promise<void> {
  if (isInitialized || isLoading) return;

  // 检查是否应该使用备用服务
  if (shouldUseFallback()) {
    useFallback = true;
    isInitialized = true;
    console.log("使用备用聊天服务");
    return;
  }

  try {
    isLoading = true;
    console.log("开始初始化WebLLM...");

    // 动态导入WebLLM
    const webllmModule = await import("@mlc-ai/web-llm");
    console.log("WebLLM模块加载成功，可用API:", Object.keys(webllmModule));

    // 尝试使用CreateMLCEngine函数
    const CreateMLCEngine =
      webllmModule.CreateMLCEngine ||
      (webllmModule.default && webllmModule.default.CreateMLCEngine);

    if (CreateMLCEngine) {
      console.log("使用CreateMLCEngine初始化");
      webllm = await CreateMLCEngine(MODEL_CONFIG.modelId, {
        initProgressCallback: (report: any) => {
          console.log(
            `初始化进度: ${(report.progress * 100).toFixed(1)}% - ${
              report.text || ""
            }`
          );
        },
      });
      console.log("WebLLM初始化成功");
    } else {
      // 尝试其他可能的初始化方式
      console.log("CreateMLCEngine不可用，尝试其他初始化方式");

      if (webllmModule.ChatModule) {
        console.log("使用ChatModule初始化");
        webllm = new webllmModule.ChatModule();
      } else if (webllmModule.WebLLM) {
        console.log("使用WebLLM初始化");
        webllm = new webllmModule.WebLLM();
      } else if (webllmModule.default) {
        console.log("使用default初始化");
        if (typeof webllmModule.default === "function") {
          webllm = new webllmModule.default();
        } else if (webllmModule.default.ChatModule) {
          webllm = new webllmModule.default.ChatModule();
        } else if (webllmModule.default.WebLLM) {
          webllm = new webllmModule.default.WebLLM();
        } else {
          throw new Error("无法找到有效的构造函数");
        }
      } else {
        throw new Error("无法找到有效的初始化方法");
      }

      // 如果成功创建了实例，尝试加载模型
      if (webllm) {
        console.log("尝试加载模型...");
        if (webllm.loadModel) {
          await webllm.loadModel(MODEL_CONFIG.modelId);
        } else if (webllm.load) {
          await webllm.load(MODEL_CONFIG.modelId);
        }
        console.log("WebLLM初始化成功");
      }
    }

    isInitialized = true;
  } catch (error) {
    console.error("WebLLM初始化失败，切换到备用服务:", error);
    useFallback = true;
    isInitialized = true;
  } finally {
    isLoading = false;
  }
}

// 检查模型是否已加载
export async function isModelLoaded(): Promise<boolean> {
  if (useFallback) return true;
  if (!isInitialized || !webllm) return false;

  try {
    if (webllm.runtimeStatsText) {
      const stats = await webllm.runtimeStatsText();
      return stats && typeof stats === "string" && stats.length > 0;
    }
    return true;
  } catch {
    return false;
  }
}

// 加载模型
export async function loadModel(options?: {
  onProgress?: (progress: number) => void;
}): Promise<void> {
  if (!isInitialized) {
    await initLLMService();
  }

  if (useFallback) {
    // 模拟加载过程
    for (let i = 0; i <= 100; i += 10) {
      options?.onProgress?.(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("备用聊天服务已准备就绪");
    return;
  }

  if (await isModelLoaded()) {
    console.log("模型已加载");
    options?.onProgress?.(100);
    return;
  }

  try {
    isLoading = true;
    console.log("开始加载模型...");

    // 模型在初始化时已经加载
    options?.onProgress?.(100);
    console.log("模型加载成功");
  } catch (error) {
    console.error("模型加载失败，切换到备用服务:", error);
    useFallback = true;
    options?.onProgress?.(100);
  } finally {
    isLoading = false;
  }
}

// 生成回复
// 在 generateResponse 函数开头添加更好的初始化检查
export async function generateResponse(
  prompt: string,
  history: Message[],
  onChunk: (chunk: string) => void
): Promise<void> {
  // 如果服务未初始化，先尝试初始化
  if (!isInitialized) {
    console.log("服务未初始化，正在初始化...");
    await initLLMService();
  }

  // 再次检查初始化状态
  if (!isInitialized) {
    throw new Error("LLM服务初始化失败");
  }

  if (useFallback) {
    return generateFallbackResponse(prompt, history, onChunk);
  }

  if (!webllm) {
    console.log("WebLLM未初始化，切换到备用服务");
    useFallback = true;
    return generateFallbackResponse(prompt, history, onChunk);
  }

  try {
    // 构建消息历史
    const messages = [
      {
        role: "system",
        content:
          "你是一个专业的加密货币K线预测系统助手。你擅长解释K线图、加密货币市场和交易策略。请提供准确、简洁的回答，不要给出具体的投资建议。",
      },
      ...history.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: prompt },
    ];

    console.log("开始生成回复...");
    console.log(
      "WebLLM实例类型:",
      typeof webllm,
      "可用方法:",
      Object.keys(webllm)
    );

    // 尝试不同的API调用方式
    if (webllm.chat && webllm.chat.completions) {
      console.log("使用chat.completions API");
      const completion = await webllm.chat.completions.create({
        messages: messages,
        temperature: 0.7,
        max_tokens: 512,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          onChunk(content);
        }
      }
    } else if (webllm.generate) {
      // 尝试使用旧版API
      console.log("使用generate API");
      const systemPrompt = messages[0].content;
      const userPrompt =
        messages
          .slice(1)
          .map(
            (msg) =>
              `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`
          )
          .join("\n") + `\nHuman: ${prompt}\nAssistant: `;

      const response = await webllm.generate(userPrompt, {
        temperature: 0.7,
        max_tokens: 512,
        system_prompt: systemPrompt,
      });

      // 模拟流式输出
      const words = response.split("");
      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        onChunk(words[i]);
      }
    } else if (webllm.chatCompletion) {
      // 尝试另一种API格式
      console.log("使用chatCompletion API");
      const response = await webllm.chatCompletion(messages, {
        temperature: 0.7,
        max_tokens: 512,
        stream: true,
        onUpdate: (chunk: string) => {
          onChunk(chunk);
        },
      });
    } else {
      throw new Error(
        "WebLLM API不可用，可用方法: " + Object.keys(webllm).join(", ")
      );
    }
  } catch (error) {
    console.error("生成回复失败，使用备用服务:", error);
    useFallback = true;
    return generateFallbackResponse(prompt, history, onChunk);
  }
}
