/**
 * TensorFlow.js 模型推理服务
 */
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-wasm";
import { BinanceKline } from "../services/binanceService";
import { InferenceResult } from "../types";

/**
 * 使用TensorFlow.js模型进行K线数据推理
 * @param klineData K线数据
 * @returns 推理结果
 */
export async function analyzeKlineData(
  klineData: BinanceKline[]
): Promise<InferenceResult> {
  // 取最近30根K线的收盘价
  const last30 = klineData.slice(-30);
  if (last30.length < 30) {
    throw new Error("K线数据不足30根");
  }

  const inputData = last30.map((item) => item.close);
  const input = tf.tensor2d([inputData], [1, 30]);

  await tf.setBackend("wasm");
  await tf.ready();
  const model = await tf.loadLayersModel("/model/model.json");
  const output = model.predict(input);

  let outArr: number[] | undefined;
  if (Array.isArray(output)) {
    outArr = Array.from(output[0].dataSync());
  } else if (output instanceof tf.Tensor) {
    outArr = Array.from(output.dataSync());
  } else if (typeof output === "object" && output !== null) {
    const firstKey = Object.keys(output)[0];
    outArr = Array.from(
      (output as Record<string, tf.Tensor>)[firstKey].dataSync()
    );
  }

  if (outArr && outArr.length > 0) {
    const result = outArr[0];
    if (result > 0.5) {
      return {
        result,
        signal: "buy",
        prob: Number(result.toFixed(2)),
      };
    } else {
      return {
        result,
        signal: "sell",
        prob: Number((1 - result).toFixed(2)),
      };
    }
  }

  return {
    result: null,
    signal: null,
    prob: null,
  };
}
