import { modelCacheService } from './cacheService';
import { swManager } from './swManager';

interface ModelConfig {
    id: string;
    name: string;
    size: string;
    loadTime: string;
    quality: 'basic' | 'good' | 'excellent';
    url?: string;
}

class FastChatService {
    private currentModel: string | null = null;
    private isInitialized = false;
    private loadingPromise: Promise<void> | null = null;
    private instantResponses: Map<string, string> = new Map();

    // 预定义的轻量级模型配置
    private readonly FAST_MODELS: ModelConfig[] = [
        {
            id: 'instant',
            name: '即时回复',
            size: '0MB',
            loadTime: '<100ms',
            quality: 'basic'
        },
        {
            id: 'Xenova/distilgpt2',
            name: 'DistilGPT-2',
            size: '40MB',
            loadTime: '10-30s',
            quality: 'basic'
        },
        {
            id: 'Xenova/gpt2',
            name: 'GPT-2',
            size: '124MB',
            loadTime: '30-60s',
            quality: 'good'
        },
        {
            id: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
            name: 'TinyLlama',
            size: '600MB',
            loadTime: '2-5min',
            quality: 'excellent'
        }
    ];

    constructor() {
        this.initInstantResponses();
    }

    async init(): Promise<void> {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.performInit();
        return this.loadingPromise;
    }

    private async performInit(): Promise<void> {
        try {
            console.log('🚀 初始化快速聊天服务...');

            // 注册 Service Worker
            const swSuccess = await swManager.register();
            if (swSuccess) {
                console.log('✅ Service Worker 注册成功');
            }

            // 初始化 IndexedDB
            await modelCacheService.init();
            console.log('✅ IndexedDB 初始化成功');

            // 清理旧缓存（保留7天）
            const cleanedCount = await modelCacheService.cleanOldCache();
            if (cleanedCount > 0) {
                console.log(`🧹 清理了 ${cleanedCount} 个旧缓存项`);
            }

            this.isInitialized = true;
            console.log('🎉 快速聊天服务初始化完成');

        } catch (error) {
            console.error('❌ 快速聊天服务初始化失败:', error);
            throw error;
        }
    }

    async quickResponse(question: string): Promise<{
        response: string;
        source: 'cache' | 'instant' | 'model';
        modelId: string;
        loadTime: number;
    }> {
        const startTime = Date.now();

        if (!this.isInitialized) {
            await this.init();
        }

        try {
            // 1. 首先检查缓存的响应
            const cachedResponse = await this.checkCachedResponse(question);
            if (cachedResponse) {
                return {
                    response: cachedResponse.response,
                    source: 'cache',
                    modelId: cachedResponse.modelId,
                    loadTime: Date.now() - startTime
                };
            }

            // 2. 检查即时回复（大幅减少匹配范围）
            const instantResponse = this.getInstantResponse(question);
            if (instantResponse) {
                // 缓存即时回复
                await modelCacheService.cacheResponse(question, instantResponse, 'instant');

                return {
                    response: instantResponse,
                    source: 'instant',
                    modelId: 'instant',
                    loadTime: Date.now() - startTime
                };
            }

            // 3. 尝试加载并使用模型（优先使用真实模型）
            console.log('🤖 问题未匹配即时回复，尝试使用真实模型...');
            const modelResponse = await this.loadAndRespond(question);

            return {
                response: modelResponse.response,
                source: 'model',
                modelId: modelResponse.modelId,
                loadTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('❌ 快速响应失败:', error);

            return {
                response: '抱歉，当前服务暂时不可用。请稍后重试或检查网络连接。',
                source: 'instant',
                modelId: 'error',
                loadTime: Date.now() - startTime
            };
        }
    }

    private async checkCachedResponse(question: string): Promise<{
        response: string;
        modelId: string;
    } | null> {
        // 检查所有可能的模型缓存
        for (const model of this.FAST_MODELS) {
            const cachedResponse = await modelCacheService.getCachedResponse(question, model.id);
            if (cachedResponse) {
                console.log('⚡ 从缓存返回响应:', model.id);
                return {
                    response: cachedResponse,
                    modelId: model.id
                };
            }
        }

        // 搜索相似问题
        const similarResponses = await modelCacheService.searchSimilarResponses(question, 'instant', 1);
        if (similarResponses.length > 0) {
            console.log('🔍 找到相似问题的缓存响应');
            return {
                response: similarResponses[0].response,
                modelId: similarResponses[0].modelId
            };
        }

        return null;
    }

    private async loadAndRespond(question: string): Promise<{
        response: string;
        modelId: string;
    }> {
        // 按优先级尝试加载模型
        const modelsToTry = this.FAST_MODELS.filter(m => m.id !== 'instant');

        for (const modelConfig of modelsToTry) {
            try {
                console.log(`🔄 尝试加载模型: ${modelConfig.name}`);

                // 检查缓存的模型状态
                const cachedState = await modelCacheService.getCachedModelState(modelConfig.id);

                let model;
                if (cachedState) {
                    console.log('📖 从缓存恢复模型状态:', modelConfig.name);
                    model = await this.restoreModelFromCache(modelConfig.id, cachedState);
                } else {
                    // 设置超时时间（根据模型大小）
                    const timeout = this.getTimeoutForModel(modelConfig);
                    model = await this.loadModelWithTimeout(modelConfig, timeout);

                    // 缓存模型状态
                    await modelCacheService.cacheModelState(modelConfig.id, model.state, '1.0');
                }

                this.currentModel = modelConfig.id;
                const response = await this.generateWithModel(model, question);

                // 缓存响应
                await modelCacheService.cacheResponse(question, response, modelConfig.id);

                return {
                    response,
                    modelId: modelConfig.id
                };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.log(`❌ 模型 ${modelConfig.name} 加载失败:`, errorMessage);
                continue;
            }
        }

        throw new Error('所有模型加载失败');
    }

    private getTimeoutForModel(modelConfig: ModelConfig): number {
        // 根据模型大小设置超时时间
        const sizeNum = parseInt(modelConfig.size);
        if (sizeNum <= 50) return 30000;   // 30秒
        if (sizeNum <= 150) return 60000;  // 1分钟
        if (sizeNum <= 700) return 180000; // 3分钟
        return 300000; // 5分钟
    }

    private async loadModelWithTimeout(modelConfig: ModelConfig, timeout: number): Promise<any> {
        return Promise.race([
            this.loadModel(modelConfig),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`加载超时 (${timeout / 1000}s)`)), timeout)
            )
        ]);
    }

    private async loadModel(modelConfig: ModelConfig): Promise<any> {
        console.log(`📥 正在加载模型: ${modelConfig.name}`);

        try {
            // 动态导入 Transformers.js
            const { pipeline } = await import('@huggingface/transformers');

            // 根据模型类型选择合适的 pipeline
            let model;
            if (modelConfig.id.includes('gpt') || modelConfig.id.includes('TinyLlama')) {
                // 文本生成模型
                model = await pipeline('text-generation', modelConfig.id, {
                    device: 'webgpu', // 优先使用 WebGPU
                    dtype: 'fp16'
                });
            } else {
                // 默认使用文本生成
                model = await pipeline('text-generation', modelConfig.id);
            }

            console.log(`✅ 模型加载成功: ${modelConfig.name}`);

            return {
                id: modelConfig.id,
                config: modelConfig,
                pipeline: model,
                state: {
                    loaded: true,
                    timestamp: Date.now(),
                    version: '1.0'
                }
            };
        } catch (error) {
            console.error(`❌ 模型加载失败: ${modelConfig.name}`, error);
            throw error;
        }
    }

    private async generateWithModel(model: any, question: string): Promise<string> {
        console.log(`🤖 使用模型 ${model.id} 生成回复`);

        try {
            if (!model.pipeline) {
                throw new Error('模型 pipeline 未初始化');
            }

            // 构建适合金融分析的提示词
            const prompt = `作为一个专业的金融技术分析师，请回答以下问题：${question}\n\n回答：`;

            // 使用模型生成回复
            const result = await model.pipeline(prompt, {
                max_new_tokens: 150,
                temperature: 0.7,
                do_sample: true,
                top_p: 0.9,
                repetition_penalty: 1.1
            });

            // 提取生成的文本
            let response = '';
            if (Array.isArray(result) && result.length > 0) {
                response = result[0].generated_text || '';
            } else if (result.generated_text) {
                response = result.generated_text;
            }

            // 清理回复（移除提示词部分）
            if (response.includes('回答：')) {
                response = response.split('回答：')[1].trim();
            }

            // 如果回复为空或太短，提供备用回复
            if (!response || response.length < 10) {
                response = `基于 ${model.id} 模型分析：您的问题很有价值。在金融技术分析中，建议结合具体的市场数据和图表进行深入分析。`;
            }

            return response;

        } catch (error) {
            console.error('❌ 模型推理失败:', error);
            // 返回错误时的备用回复
            return `抱歉，${model.id} 模型当前无法处理您的问题。请尝试重新表述或稍后再试。`;
        }
    }

    private async restoreModelFromCache(modelId: string, cachedState: any): Promise<any> {
        // 从缓存恢复模型
        console.log('⚡ 从缓存恢复模型:', modelId);

        return {
            id: modelId,
            state: cachedState
        };
    }

    private initInstantResponses(): void {
        // 大幅减少即时回复库，只保留最基础的术语
        const responses = new Map([
            ['帮助', '我是金融技术分析助手，可以回答K线、技术指标、交易策略等相关问题。'],
            ['help', '我是金融技术分析助手，可以回答K线、技术指标、交易策略等相关问题。']
        ]);

        this.instantResponses = responses;
    }

    private getInstantResponse(question: string): string | null {
        const lowerQuestion = question.toLowerCase().trim();

        // 只对非常基础的帮助信息进行精确匹配
        for (const [keyword, response] of this.instantResponses.entries()) {
            if (lowerQuestion === keyword) {
                console.log('⚡ 即时回复匹配:', keyword);
                return response;
            }
        }

        // 完全移除模糊匹配，让所有实际问题都走模型推理
        console.log('🔄 问题未匹配即时回复，将使用模型推理');
        return null;
    }

    // 获取服务状态
    async getServiceStatus(): Promise<{
        isInitialized: boolean;
        currentModel: string | null;
        cacheStats: any;
        availableModels: ModelConfig[];
    }> {
        const cacheStats = this.isInitialized
            ? await modelCacheService.getCacheStats()
            : null;

        return {
            isInitialized: this.isInitialized,
            currentModel: this.currentModel,
            cacheStats,
            availableModels: this.FAST_MODELS
        };
    }

    // 预加载模型
    async preloadModel(modelId: string): Promise<boolean> {
        try {
            const modelConfig = this.FAST_MODELS.find(m => m.id === modelId);
            if (!modelConfig || modelConfig.id === 'instant') {
                return false;
            }

            console.log('🔄 预加载模型:', modelConfig.name);
            const model = await this.loadModel(modelConfig);
            await modelCacheService.cacheModelState(modelId, model.state, '1.0');

            return true;
        } catch (error) {
            console.error('❌ 预加载模型失败:', error);
            return false;
        }
    }

    // 清理缓存
    async clearCache(): Promise<void> {
        await modelCacheService.clearAllCache();
        await swManager.clearCache();
        this.currentModel = null;
        console.log('🗑️ 所有缓存已清理');
    }
}

export const fastChatService = new FastChatService();