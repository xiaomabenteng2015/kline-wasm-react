/**
 * LLM Worker - 在后台线程中处理模型推理
 */

// 捕获全局错误
self.addEventListener("error", function (e) {
  self.postMessage({
    type: "error",
    error: `Worker错误: ${e.message} at ${e.filename}:${e.lineno}`,
  });
});

// 捕获未处理的Promise拒绝
self.addEventListener("unhandledrejection", function (e) {
  self.postMessage({
    type: "error",
    error: `Worker未处理的Promise拒绝: ${e.reason}`,
  });
});

// 模型实例
let webllm = null;
let pipeline = null;
let isInitialized = false;
let isLoading = false;

// 初始化WebLLM
async function initWebLLM() {
  if (isInitialized || isLoading) return;

  try {
    isLoading = true;
    self.postMessage({ type: "log", message: "Worker: 开始初始化WebLLM" });

    // 导入WebLLM
    importScripts(
      "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.24/dist/web-llm.js"
    );

    // 创建WebLLM实例 - 处理不同版本的API
    if (self.webllm && self.webllm.ChatModule) {
      webllm = new self.webllm.ChatModule();
      self.postMessage({
        type: "log",
        message: "Worker: 使用ChatModule初始化",
      });
    } else if (self.webllm && self.webllm.WebLLM) {
      webllm = new self.webllm.WebLLM();
      self.postMessage({ type: "log", message: "Worker: 使用WebLLM初始化" });
    } else if (self.ChatModule) {
      webllm = new self.ChatModule();
      self.postMessage({
        type: "log",
        message: "Worker: 使用全局ChatModule初始化",
      });
    } else if (self.WebLLM) {
      webllm = new self.WebLLM();
      self.postMessage({
        type: "log",
        message: "Worker: 使用全局WebLLM初始化",
      });
    } else {
      throw new Error("找不到WebLLM或ChatModule构造函数");
    }

    isInitialized = true;
    self.postMessage({ type: "log", message: "Worker: WebLLM初始化成功" });
    self.postMessage({ type: "initialized" });
  } catch (error) {
    self.postMessage({
      type: "error",
      error: `Worker: WebLLM初始化失败: ${error.message}`,
    });
  } finally {
    isLoading = false;
  }
}

// 加载模型
async function loadModel(modelConfig, requestId) {
  if (!isInitialized) {
    await initWebLLM();
  }

  try {
    isLoading = true;
    self.postMessage({
      type: "log",
      message: `Worker: 开始加载模型 ${modelConfig.modelId}`,
    });

    // 创建推理管道
    await webllm.createChatPipeline({
      model: modelConfig.modelId,
      quantized: modelConfig.quantized,
      modelUrl: modelConfig.modelUrl,
      progress: (report) => {
        const progress = report.progress * 100;
        self.postMessage({
          type: "progress",
          requestId,
          progress,
        });
      },
    });

    pipeline = webllm.pipeline;

    self.postMessage({
      type: "loaded",
      requestId,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId,
      error: `Worker: 模型加载失败: ${error.message}`,
    });
  } finally {
    isLoading = false;
  }
}

// 生成回复
async function generateResponse(prompt, history, systemPrompt, requestId) {
  if (!isInitialized || !pipeline) {
    self.postMessage({
      type: "error",
      requestId,
      error: "Worker: 模型未初始化或未加载",
    });
    return;
  }

  try {
    // 设置生成参数
    const generateConfig = {
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: prompt },
      ],
      stream: true,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.95,
    };

    // 流式生成
    let fullResponse = "";
    for await (const chunk of pipeline.generate(generateConfig)) {
      if (chunk.text) {
        fullResponse += chunk.text;
        self.postMessage({
          type: "chunk",
          requestId,
          text: chunk.text,
        });
      }
    }

    self.postMessage({
      type: "complete",
      requestId,
      text: fullResponse,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId,
      error: `Worker: 生成回复失败: ${error.message}`,
    });
  }
}

// 处理消息
self.onmessage = async function (e) {
  const { type, data } = e.data;

  switch (type) {
    case "init":
      await initWebLLM();
      break;

    case "load":
      await loadModel(data.modelConfig, data.requestId);
      break;

    case "generate":
      await generateResponse(
        data.prompt,
        data.history,
        data.systemPrompt,
        data.requestId
      );
      break;

    default:
      self.postMessage({
        type: "error",
        error: `Worker: 未知消息类型: ${type}`,
      });
  }
};
