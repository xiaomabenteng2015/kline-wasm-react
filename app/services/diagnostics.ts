/**
 * 诊断工具 - 用于检查WebLLM初始化状态和环境
 */

// 检查浏览器环境
export function checkBrowserEnvironment(): {
  supported: boolean;
  details: Record<string, boolean | string>;
  recommendations: string[];
} {
  if (typeof window === "undefined") {
    return {
      supported: false,
      details: { serverSide: true },
      recommendations: ["WebLLM只能在浏览器环境中运行"],
    };
  }

  const details: Record<string, boolean | string> = {
    userAgent: navigator.userAgent,
    webGPU: !!navigator.gpu,
    webGL: !!window.WebGLRenderingContext,
    webGL2: !!window.WebGL2RenderingContext,
    webAssembly: typeof WebAssembly !== "undefined",
    sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    serviceWorker: "serviceWorker" in navigator,
  };

  // 检查内存
  if ("deviceMemory" in navigator) {
    details.deviceMemory = (navigator as any).deviceMemory + "GB";
  }

  // 检查硬件并发
  if ("hardwareConcurrency" in navigator) {
    details.hardwareConcurrency = navigator.hardwareConcurrency;
  }

  // 检查网络连接
  if ("connection" in navigator) {
    const connection = (navigator as any).connection;
    details.networkType = connection.effectiveType;
    details.saveData = connection.saveData;
  }

  // 检查浏览器
  const ua = navigator.userAgent;
  details.isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  details.isEdge = /Edg/.test(ua);
  details.isFirefox = /Firefox/.test(ua);
  details.isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  details.isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // 生成建议
  const recommendations: string[] = [];

  if (!details.webGPU) {
    recommendations.push(
      "启用WebGPU以获得更好的性能（在Chrome中访问chrome://flags/#enable-unsafe-webgpu）"
    );
  }

  if (details.isMobile) {
    recommendations.push("移动设备可能无法运行大型模型，建议使用桌面设备");
  }

  if (!details.isChrome && !details.isEdge) {
    recommendations.push("建议使用Chrome或Edge浏览器以获得最佳兼容性");
  }

  if (
    typeof (navigator as any).deviceMemory !== "undefined" &&
    (navigator as any).deviceMemory < 4
  ) {
    recommendations.push("设备内存不足，可能会影响性能");
  }

  const supported =
    details.webAssembly &&
    (details.webGPU || details.webGL2) &&
    !details.isMobile;

  return {
    supported,
    details,
    recommendations,
  };
}

// 检查WebLLM模块
export async function checkWebLLMModule(): Promise<{
  available: boolean;
  apis: string[];
  error?: string;
}> {
  try {
    const webllmModule = await import("@mlc-ai/web-llm");
    return {
      available: true,
      apis: Object.keys(webllmModule),
    };
  } catch (error) {
    return {
      available: false,
      apis: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// 导出诊断函数
export async function runDiagnostics(): Promise<{
  environment: ReturnType<typeof checkBrowserEnvironment>;
  webllm: Awaited<ReturnType<typeof checkWebLLMModule>>;
}> {
  const environment = checkBrowserEnvironment();
  const webllm = await checkWebLLMModule();

  return {
    environment,
    webllm,
  };
}
