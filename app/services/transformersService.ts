// 动态导入 transformers.js 以避免 SSR 问题
let pipeline: any = null;
let env: any = null;

// 初始化 transformers.js 模块
async function initTransformersModule() {
    if (typeof window === 'undefined') {
        throw new Error('Transformers.js can only be used in browser environment');
    }

    if (!pipeline || !env) {
        const transformers = await import('@huggingface/transformers');
        pipeline = transformers.pipeline;
        env = transformers.env;

        // 配置 transformers.js
        env.allowRemoteModels = false;
        env.allowLocalModels = true;
        env.localModelPath = '/models/';
        env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
    }
}

let textGenerator: any = null;
let isInitialized = false;
let isLoading = false;

export async function initTransformersService(onProgress?: (progress: number) => void) {
    if (isInitialized || isLoading) return;

    try {
        isLoading = true;
        onProgress?.(5);

        // 首先初始化 transformers 模块
        await initTransformersModule();
        onProgress?.(10);

        console.log('Initializing Transformers.js service...');

        // 使用 transformers.js 加载模型
        textGenerator = await pipeline(
            'text-generation',
            'qwen1.5-0.5b-chat',
            {
                progress_callback: (progress: any) => {
                    // 将进度映射到 5-95% 范围，为最终验证留出空间
                    const percentage = Math.round(progress.progress * 90) + 5;
                    onProgress?.(percentage);
                    console.log(`Loading progress: ${percentage}%`);
                }
            }
        );

        // 验证模型是否真正可用
        if (textGenerator) {
            // 只有在这里才真正标记为初始化完成
            isInitialized = true;
            onProgress?.(10000);
            console.log('Transformers.js service initialized successfully');
        } else {
            throw new Error('Model initialization failed: textGenerator is null');
        }

    } catch (error) {
        console.error('Failed to initialize transformers.js:', error);
        isLoading = false;
        throw error;
    } finally {
        isLoading = false;
    }
}

// ... existing code ...
// 保持其他函数不变
export async function generateTransformersResponse(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void
) {
    if (!isInitialized || !textGenerator) {
        // 演示模式回退
        const demoResponses = [
            "我是基于 Transformers.js 的 AI 助手，很高兴为您服务！这是一个演示回复。",
            "Transformers.js 让在浏览器中运行 AI 模型变得更加简单和强大！",
            "这个新的实现使用了官方的 Hugging Face 分词器，生成质量更高。"
        ];

        const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];

        // 模拟流式输出
        for (let i = 0; i < response.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 30));
            onChunk(response[i]);
        }
        return;
    }

    try {
        // 构建对话格式
        let conversation = '';
        for (const msg of history) {
            if (msg.role === 'user') {
                conversation += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
            } else {
                conversation += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
            }
        }
        conversation += `<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;

        console.log('Generating response with Transformers.js...');

        // 使用 transformers.js 生成
        const result = await textGenerator(conversation, {
            max_new_tokens: 50,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false
        });

        // 处理生成结果
        if (result && result[0]?.generated_text) {
            const generatedText = result[0].generated_text;

            // 模拟流式输出
            for (let i = 0; i < generatedText.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 20));
                onChunk(generatedText[i]);
            }
        }

    } catch (error) {
        console.error('Generation failed:', error);

        // 错误回退
        const errorResponse = "抱歉，生成过程中出现了错误。这是使用 Transformers.js 的备用回复。";
        for (let i = 0; i < errorResponse.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            onChunk(errorResponse[i]);
        }
    }
}

export function isTransformersServiceReady(): boolean {
    return isInitialized && textGenerator !== null;
}

export function isTransformersServiceLoading(): boolean {
    return isLoading;
}

export function cleanupTransformersService() {
    textGenerator = null;
    isInitialized = false;
    isLoading = false;
}