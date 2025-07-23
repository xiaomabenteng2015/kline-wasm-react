/**
 * LLM服务 - 管理WebLLM模型加载和推理
 */
import { Message } from "../ai/components/ChatInterface";

// 模型配置
const MODEL_CONFIG = {
  modelId: "Qwen2-1.5B-Instruct-q4f16_1-MLC", // 使用Qwen2-1.5B模型
  quantized: true,
};

// 模块级变量
let webllm: any = null;
let isInitialized = false;
let isLoading = false;

// 初始化LLM服务
export async function initLLMService(): Promise<void> {
  if (isInitialized || isLoading) return;

  try {
    isLoading = true;

    // 打印环境信息，帮助调试
    console.log("========== 环境信息 ==========");
    console.log("安全上下文:", window.isSecureContext ? "是" : "否");
    console.log("协议:", window.location.protocol);
    console.log("WebGPU可用:", !!navigator.gpu);
    console.log(
      "SharedArrayBuffer可用:",
      typeof SharedArrayBuffer !== "undefined"
    );
    console.log("Cache API可用:", typeof caches !== "undefined");
    console.log("==============================");

    console.log("开始初始化WebLLM...");

    // 动态导入WebLLM
    const webllmModule = await import("@mlc-ai/web-llm");
    console.log("WebLLM模块加载成功，可用API:", Object.keys(webllmModule));

    // 使用CreateMLCEngine函数
    if (webllmModule.CreateMLCEngine) {
      console.log("使用CreateMLCEngine初始化");
      webllm = await webllmModule.CreateMLCEngine(MODEL_CONFIG.modelId, {
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
      throw new Error("CreateMLCEngine不可用，请检查WebLLM版本");
    }

    isInitialized = true;
  } catch (error) {
    console.error("WebLLM初始化失败:", error);
    throw error;
  } finally {
    isLoading = false;
  }
}

// 检查模型是否已加载
export async function isModelLoaded(): Promise<boolean> {
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
  try {
    // 初始化服务（这会加载模型）
    if (!isInitialized) {
      console.log("初始化LLM服务...");
      await initLLMService();
    }

    // 模型已经在初始化时加载
    console.log("模型已加载");
    options?.onProgress?.(100);
  } catch (error) {
    console.error("加载模型失败:", error);
    throw error;
  }
}

// 生成回复
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
  if (!isInitialized || !webllm) {
    throw new Error("LLM服务初始化失败");
  }

  try {
    console.log("开始生成回复...");
    console.log(
      "WebLLM实例类型:",
      typeof webllm,
      "可用方法:",
      Object.keys(webllm)
    );

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

    // 使用 chat.completions API (OpenAI 兼容)
    if (
      webllm.chat &&
      webllm.chat.completions &&
      webllm.chat.completions.create
    ) {
      console.log("使用 chat.completions API");

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
    }
    // 使用简单的 generate 方法
    else if (webllm.generate) {
      console.log("使用 generate 方法");

      // 构建简单的提示
      const systemPrompt =
        "你是一个专业的加密货币K线预测系统助手。你擅长解释K线图、加密货币市场和交易策略。请提供准确、简洁的回答，不要给出具体的投资建议。";
      const fullPrompt = `${systemPrompt}\n\n用户: ${prompt}\n助手: `;

      const response = await webllm.generate(fullPrompt, {
        temperature: 0.7,
        max_tokens: 512,
      });

      // 模拟流式输出
      const words = response.split("");
      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        onChunk(words[i]);
      }
    }
    // 使用 completions 方法（如果存在）
    else if (webllm.completions) {
      console.log("使用 completions 方法");

      const systemPrompt =
        "你是一个专业的加密货币K线预测系统助手。你擅长解释K线图、加密货币市场和交易策略。请提供准确、简洁的回答，不要给出具体的投资建议。";
      const fullPrompt = `${systemPrompt}\n\n用户: ${prompt}\n助手: `;

      const response = await webllm.completions(fullPrompt, {
        temperature: 0.7,
        max_tokens: 512,
      });

      // 模拟流式输出
      const words = response.split("");
      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        onChunk(words[i]);
      }
    } else {
      throw new Error(
        "无法找到支持的WebLLM API，可用方法: " + Object.keys(webllm).join(", ")
      );
    }
  } catch (error) {
    console.error("生成回复失败:", error);
    throw error;
  }
}
