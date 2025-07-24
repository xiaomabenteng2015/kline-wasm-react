/**
 * ONNX相关类型定义
 */

export interface OnnxMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface OnnxModelStatus {
  isLoading: boolean;
  isReady: boolean;
  progress: number;
  error: string | null;
}

export interface OnnxServiceConfig {
  modelPath: string;
  tokenizerPath: string;
  maxLength: number;
  temperature: number;
  topP: number;
}