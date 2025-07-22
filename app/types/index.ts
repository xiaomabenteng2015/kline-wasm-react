/**
 * 项目共享类型定义
 */

/**
 * K线数据类型
 */
export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 推理结果类型
 */
export interface InferenceResult {
  result: number | null;
  signal: string | null;
  prob: number | null;
}