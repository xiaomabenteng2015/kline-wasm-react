/**
 * K线数据处理 Web Worker
 * 使用TensorFlow.js进行模型推理
 */

// 捕获全局错误
self.addEventListener("error", function (e) {
  self.postMessage({
    type: "log",
    message: `Worker全局错误: ${e.message} at ${e.filename}:${e.lineno}`,
  });
});

// 捕获未处理的Promise拒绝
self.addEventListener("unhandledrejection", function (e) {
  self.postMessage({
    type: "log",
    message: `Worker未处理的Promise拒绝: ${e.reason}`,
  });
});

try {
  // 加载TensorFlow.js
  self.postMessage({ type: "log", message: "Worker: 开始加载TensorFlow.js" });
  importScripts(
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.2.0/dist/tf.min.js"
  );
  self.postMessage({ type: "log", message: "Worker: TensorFlow.js加载成功" });

  // 加载WASM后端
  self.postMessage({ type: "log", message: "Worker: 开始加载WASM后端" });
  importScripts(
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.2.0/dist/tf-backend-wasm.js"
  );
  self.postMessage({ type: "log", message: "Worker: WASM后端加载成功" });
} catch (error) {
  self.postMessage({
    type: "log",
    message: `Worker: 加载TensorFlow.js失败: ${error.message}`,
  });
}

// 通知主线程Worker已加载
self.postMessage({ type: "ready" });

// 模型实例缓存
let model = null;
let modelLoading = false;
let modelLoadingPromise = null;

// 加载模型
async function loadModel() {
  if (model) return model;

  if (modelLoading) {
    // 如果模型正在加载中，等待加载完成
    return modelLoadingPromise;
  }

  modelLoading = true;
  modelLoadingPromise = (async () => {
    try {
      self.postMessage({ type: "log", message: "Worker: 开始加载模型" });

      try {
        // 设置WASM路径
        if (self.tf && self.tf.wasm) {
          self.postMessage({ type: "log", message: "Worker: 设置WASM路径" });
          self.tf.wasm.setWasmPaths("/tfjs-backend-wasm/");
        } else {
          self.postMessage({
            type: "log",
            message: "Worker: tf.wasm不可用，跳过设置WASM路径",
          });
        }
      } catch (wasmError) {
        self.postMessage({
          type: "log",
          message: `Worker: 设置WASM路径失败: ${wasmError.message}`,
        });
      }

      try {
        self.postMessage({ type: "log", message: "Worker: 设置后端为WASM" });
        await self.tf.setBackend("wasm");
        await self.tf.ready();
        self.postMessage({
          type: "log",
          message: `Worker: 后端已准备好: ${self.tf.getBackend()}`,
        });
      } catch (backendError) {
        self.postMessage({
          type: "log",
          message: `Worker: 设置后端失败: ${backendError.message}，尝试使用默认后端`,
        });

        try {
          await self.tf.ready();
          self.postMessage({
            type: "log",
            message: `Worker: 使用默认后端: ${self.tf.getBackend()}`,
          });
        } catch (defaultBackendError) {
          self.postMessage({
            type: "log",
            message: `Worker: 默认后端初始化失败: ${defaultBackendError.message}`,
          });
        }
      }

      try {
        // 尝试加载模型
        self.postMessage({ type: "log", message: "Worker: 尝试加载模型" });
        model = await self.tf.loadLayersModel("/model/model.json");
        self.postMessage({ type: "log", message: "Worker: 模型加载成功" });
      } catch (modelError) {
        self.postMessage({
          type: "log",
          message: `Worker: 模型加载失败: ${modelError.message}，创建模拟模型`,
        });

        // 创建一个简单的模拟模型
        model = self.tf.sequential();
        model.add(
          self.tf.layers.dense({
            units: 1,
            inputShape: [30],
            activation: "sigmoid",
          })
        );

        // 随机初始化权重
        const weights = self.tf.randomNormal([30, 1]);
        const bias = self.tf.zeros([1]);
        model.layers[0].setWeights([weights, bias]);

        self.postMessage({ type: "log", message: "Worker: 模拟模型创建成功" });
      }

      try {
        // 预热模型
        self.postMessage({ type: "log", message: "Worker: 开始预热模型" });
        const dummyInput = self.tf.zeros([1, 30]);
        const warmupResult = model.predict(dummyInput);
        await warmupResult.data();
        warmupResult.dispose();
        dummyInput.dispose();
        self.postMessage({ type: "log", message: "Worker: 模型预热完成" });
      } catch (warmupError) {
        self.postMessage({
          type: "log",
          message: `Worker: 模型预热失败: ${warmupError.message}`,
        });
      }

      return model;
    } catch (error) {
      self.postMessage({
        type: "log",
        message: `Worker: 模型初始化失败: ${error.message}`,
      });
      throw error;
    } finally {
      modelLoading = false;
    }
  })();

  return modelLoadingPromise;
}

// 模型缓存映射
const modelCache = new Map();
let normParams = null;

// 加载自定义模型
async function loadCustomModel(modelName) {
  if (modelCache.has(modelName)) {
    return modelCache.get(modelName);
  }

  try {
    self.postMessage({
      type: "log",
      message: `Worker: 开始加载自定义模型 ${modelName}`,
    });

    // 请求主线程加载模型
    self.postMessage({
      type: "loadModel",
      modelName,
    });

    // 等待主线程返回模型数据
    const modelData = await new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.type === "modelData" && e.data.modelName === modelName) {
          self.removeEventListener("message", handler);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.data);
          }
        }
      };

      self.addEventListener("message", handler);

      // 设置超时
      setTimeout(() => {
        self.removeEventListener("message", handler);
        reject(new Error("加载模型超时"));
      }, 10000);
    });

    // 从ArrayBuffer加载模型
    const modelArtifacts = JSON.parse(modelData.modelJSON);
    const weightData = modelData.weightData;

    const model = await self.tf.loadLayersModel(
      self.tf.io.fromMemory(modelArtifacts, weightData)
    );

    // 保存归一化参数
    normParams = modelData.normParams;

    // 缓存模型
    modelCache.set(modelName, model);

    self.postMessage({
      type: "log",
      message: `Worker: 自定义模型 ${modelName} 加载成功`,
    });

    return model;
  } catch (error) {
    self.postMessage({
      type: "log",
      message: `Worker: 加载自定义模型失败: ${error.message}`,
    });
    throw error;
  }
}

// 处理消息
self.onmessage = async (e) => {
  try {
    const { type, data, id, modelName } = e.data;

    if (type === "analyze") {
      const klineData = data;

      try {
        self.postMessage({
          type: "log",
          message: `Worker: 收到分析请求 ID: ${id}, 数据长度: ${klineData.length}`,
        });

        // 取最近30根K线的收盘价
        const last30 = klineData.slice(-30);
        if (last30.length < 30) {
          throw new Error("K线数据不足30根");
        }

        // 加载模型（如果尚未加载）
        let loadedModel;

        if (modelName) {
          // 加载自定义模型
          self.postMessage({
            type: "log",
            message: `Worker: 开始加载自定义模型 ${modelName}`,
          });
          loadedModel = await loadCustomModel(modelName);
        } else {
          // 加载默认模型
          self.postMessage({
            type: "log",
            message: "Worker: 开始加载默认模型",
          });
          loadedModel = await loadModel();
        }

        self.postMessage({ type: "log", message: "Worker: 模型加载完成" });

        // 准备输入数据
        let inputData = last30.map((item) => item.close);

        // 如果有归一化参数，应用归一化
        if (normParams && modelName) {
          self.postMessage({ type: "log", message: "Worker: 应用数据归一化" });
          const mean = self.tf.tensor1d(normParams.mean);
          const std = self.tf.tensor1d(normParams.std);

          const inputTensor = self.tf.tensor1d(inputData);
          const normalizedInput = inputTensor.sub(mean).div(std);

          inputData = Array.from(normalizedInput.dataSync());

          // 清理张量
          mean.dispose();
          std.dispose();
          inputTensor.dispose();
          normalizedInput.dispose();
        }

        // 创建输入张量
        let input;
        if (modelName && normParams) {
          // 对于LSTM模型，需要重塑为3D张量
          input = self.tf.tensor3d([inputData], [1, inputData.length, 1]);
        } else {
          // 对于默认模型，使用2D张量
          input = self.tf.tensor2d([inputData], [1, inputData.length]);
        }

        // 执行推理
        self.postMessage({ type: "log", message: "Worker: 开始执行推理" });
        const output = loadedModel.predict(input);

        // 处理输出
        let outArr;
        if (output instanceof self.tf.Tensor) {
          outArr = Array.from(output.dataSync());
        } else {
          const firstKey = Object.keys(output)[0];
          outArr = Array.from(output[firstKey].dataSync());
        }

        // 生成结果
        const result = outArr[0];
        const signal = result > 0.5 ? "buy" : "sell";
        const prob =
          result > 0.5
            ? Number(result.toFixed(2))
            : Number((1 - result).toFixed(2));

        self.postMessage({
          type: "log",
          message: `Worker: 推理完成, 结果: ${signal}, 概率: ${prob}`,
        });

        // 返回结果
        self.postMessage({
          type: "result",
          id,
          data: {
            index: klineData.length - 1,
            result,
            signal,
            prob,
            modelName: modelName || "default",
          },
        });

        // 清理张量
        input.dispose();
        if (output instanceof self.tf.Tensor) {
          output.dispose();
        } else {
          Object.values(output).forEach((tensor) => tensor.dispose());
        }
      } catch (error) {
        self.postMessage({
          type: "log",
          message: `Worker: 推理错误: ${error.message}`,
        });

        // 发送错误信息
        self.postMessage({
          type: "error",
          id,
          error: error.message,
        });
      }
    }
  } catch (error) {
    self.postMessage({
      type: "log",
      message: `Worker: 消息处理错误: ${error.message}`,
    });
  }
};
