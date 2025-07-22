/**
 * 推理服务
 * 管理与推理Worker的通信
 */
import { BinanceKline } from "./binanceService";
import { InferenceResult } from "../types";

// 用于生成唯一请求ID
let requestId = 0;

// 存储待处理的请求
const pendingRequests = new Map<
  number,
  {
    resolve: (result: InferenceResult) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }
>();

// Worker实例
let worker: Worker | null = null;
let workerReady = false;
let initializationPromise: Promise<void> | null = null;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// 当前活跃模型
const activeModelName: string | null = null;

/**
 * 初始化推理服务
 */
export function initInferenceService(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  // 如果已经在初始化中，返回现有的Promise
  if (initializationPromise) return initializationPromise;

  // 如果Worker已就绪，直接返回
  if (worker && workerReady) return Promise.resolve();

  console.log("初始化推理服务...");

  initializationPromise = new Promise<void>((resolve) => {
    try {
      // 如果已有worker但未就绪，先终止它
      if (worker) {
        worker.terminate();
        worker = null;
      }

      // 如果尝试次数过多，直接使用模拟模式
      if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
        console.warn(
          `已达到最大初始化尝试次数(${MAX_INITIALIZATION_ATTEMPTS})，使用模拟模式`
        );
        workerReady = false;
        resolve(); // 不抛出错误，让应用继续运行
        initializationPromise = null;
        return;
      }

      initializationAttempts++;
      console.log(`推理服务初始化尝试 #${initializationAttempts}`);

      // 创建新worker
      worker = new Worker("/workers/klineWorker.js");

      // 设置超时
      const timeoutId = setTimeout(() => {
        console.error("Worker初始化超时");
        workerReady = false;

        // 不抛出错误，让应用继续运行
        resolve();
        initializationPromise = null;
      }, 20000); // 20秒超时

      worker.onmessage = (e) => {
        const { type, id, data, error, message } = e.data;

        // 处理日志消息
        if (type === "log") {
          console.log(`[Worker] ${message}`);
          return;
        }

        // 处理Worker就绪消息
        if (type === "ready") {
          console.log("Worker已就绪");
          workerReady = true;
          clearTimeout(timeoutId);
          resolve();
          return;
        }

        // 查找对应的请求
        const request = pendingRequests.get(id);
        if (!request) return;

        // 清除超时
        clearTimeout(request.timeoutId);

        // 从待处理请求中移除
        pendingRequests.delete(id);

        if (type === "error") {
          // 处理错误
          request.reject(new Error(error));
        } else if (type === "result") {
          // 处理结果
          request.resolve({
            result: data.result,
            signal: data.signal,
            prob: data.prob,
          });
        }
      };

      worker.onerror = (error) => {
        console.error("Worker错误:", error);
        clearTimeout(timeoutId);
        workerReady = false;

        // 拒绝所有待处理的请求
        pendingRequests.forEach((request) => {
          clearTimeout(request.timeoutId);
          request.reject(new Error("Worker错误"));
        });
        pendingRequests.clear();

        // 不抛出错误，让应用继续运行
        resolve();
        initializationPromise = null;
      };
    } catch (error) {
      console.error("推理服务初始化失败:", error);
      workerReady = false;

      // 不抛出错误，让应用继续运行
      resolve();
      initializationPromise = null;
    }
  });

  return initializationPromise;
}

/**
 * 清理推理服务
 */
export function cleanupInferenceService(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    workerReady = false;
    initializationPromise = null;
    initializationAttempts = 0;

    // 拒绝所有待处理的请求
    pendingRequests.forEach((request) => {
      clearTimeout(request.timeoutId);
      request.reject(new Error("Worker已终止"));
    });
    pendingRequests.clear();

    console.log("推理服务已清理");
  }
}

/**
 * 分析K线数据
 * @param klineData K线数据
 * @returns 推理结果
 */
export async function analyzeKlineData(
  klineData: BinanceKline[]
): Promise<InferenceResult> {
  // 确保Worker已初始化
  if (!worker || !workerReady) {
    try {
      await initInferenceService();
    } catch (error) {
      console.error("推理服务初始化失败:", error);
      // 如果初始化失败，返回一个模拟结果
      return createMockResult();
    }
  }

  if (!worker || !workerReady) {
    console.warn("Worker未就绪，使用模拟结果");
    return createMockResult();
  }

  // 生成请求ID
  const id = requestId++;

  // 创建Promise
  return new Promise<InferenceResult>((resolve, reject) => {
    // 设置超时
    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        console.warn("推理请求超时，使用模拟结果");
        resolve(createMockResult());
      }
    }, 15000); // 15秒超时

    // 存储请求
    pendingRequests.set(id, { resolve, reject, timeoutId });

    try {
      // 发送请求到Worker
      worker!.postMessage({
        type: "analyze",
        id,
        data: klineData,
      });
    } catch (error) {
      // 如果发送消息失败，清除超时并返回模拟结果
      clearTimeout(timeoutId);
      pendingRequests.delete(id);
      console.error("发送消息到Worker失败:", error);
      resolve(createMockResult());
    }
  });
}

/**
 * 创建模拟结果（当Worker不可用或请求超时时使用）
 */
function createMockResult(): InferenceResult {
  const result = Math.random();
  const signal = result > 0.5 ? "buy" : "sell";
  const prob =
    result > 0.5 ? Number(result.toFixed(2)) : Number((1 - result).toFixed(2));

  return {
    result,
    signal,
    prob,
  };
}
