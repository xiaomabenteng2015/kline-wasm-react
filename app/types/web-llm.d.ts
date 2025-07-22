declare module "@mlc-ai/web-llm" {
  export interface InitProgressReport {
    progress: number;
    timeElapsed: number;
    text: string;
  }

  export interface ChatCompletionChunk {
    choices: Array<{
      delta: {
        content?: string;
        role?: string;
      };
      finish_reason?: string;
    }>;
  }

  export interface ChatCompletion {
    choices: Array<{
      message: {
        content: string;
        role: string;
      };
      finish_reason: string;
    }>;
  }

  export interface MLCEngine {
    chat: {
      completions: {
        create(params: {
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          max_tokens?: number;
          stream?: boolean;
        }): Promise<AsyncIterable<ChatCompletionChunk> | ChatCompletion>;
      };
    };
    runtimeStatsText(): Promise<string>;
  }

  export function CreateMLCEngine(
    modelId: string,
    engineConfig?: {
      initProgressCallback?: (report: InitProgressReport) => void;
    }
  ): Promise<MLCEngine>;

  export function CreateWebWorkerMLCEngine(
    worker: Worker,
    modelId: string,
    engineConfig?: {
      initProgressCallback?: (report: InitProgressReport) => void;
    }
  ): Promise<MLCEngine>;

  // 旧版API兼容
  export class ChatModule {
    constructor();
    loadModel(modelId: string): Promise<void>;
    generate(prompt: string, options?: any): Promise<string>;
    runtimeStatsText: string;
  }

  export class WebLLM {
    constructor();
    load(modelId: string): Promise<void>;
    generate(prompt: string, options?: any): Promise<string>;
    runtimeStatsText: string;
  }

  // 默认导出
  export default {
    CreateMLCEngine,
    CreateWebWorkerMLCEngine,
    ChatModule,
    WebLLM,
  };
}
