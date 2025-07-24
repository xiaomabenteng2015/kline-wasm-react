/**
 * ONNX推理服务 - 使用onnxruntime-web和简化分词器
 */
import { InferenceSession, Tensor } from 'onnxruntime-web';

// 模型配置
const MODEL_CONFIG = {
    modelPath: '/models/qwen1.5-0.5b-chat/decoder_model_merged_quantized.onnx',
    maxLength: 2048,
    temperature: 0.7,
    topP: 0.9,
    vocabSize: 151936, // Qwen2 词汇表大小
};

// 服务状态
let session: InferenceSession | null = null;
let isInitialized = false;
let isLoading = false;

// 简化的分词器 - 使用字符级分词作为演示
class SimpleTokenizer {
    private charToId: Map<string, number> = new Map();
    private idToChar: Map<number, string> = new Map();
    private nextId = 0;

    constructor() {
        // 初始化基本字符映射
        this.initBasicChars();
    }

    private initBasicChars() {
        // 添加基本ASCII字符
        for (let i = 0; i < 128; i++) {
            const char = String.fromCharCode(i);
            this.charToId.set(char, this.nextId);
            this.idToChar.set(this.nextId, char);
            this.nextId++;
        }

        // 添加常用中文字符范围的一些字符
        const commonChars = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞';

        for (const char of commonChars) {
            if (!this.charToId.has(char)) {
                this.charToId.set(char, this.nextId);
                this.idToChar.set(this.nextId, char);
                this.nextId++;
            }
        }

        // 添加特殊token
        this.charToId.set('<|im_start|>', this.nextId++);
        this.charToId.set('<|im_end|>', this.nextId++);
        this.charToId.set('<|endoftext|>', this.nextId++);
        this.charToId.set('[UNK]', this.nextId++);
    }

    encode(text: string): number[] {
        const tokens: number[] = [];

        for (const char of text) {
            const id = this.charToId.get(char);
            if (id !== undefined) {
                tokens.push(id);
            } else {
                // 未知字符使用 [UNK] token
                const unkId = this.charToId.get('[UNK]')!;
                tokens.push(unkId);
            }
        }

        return tokens;
    }

    decode(tokens: number[]): string {
        return tokens
            .map(id => this.idToChar.get(id) || '[UNK]')
            .join('');
    }

    get eosTokenId(): number {
        return this.charToId.get('<|endoftext|>')!;
    }
}

let tokenizer: SimpleTokenizer | null = null;

/**
 * 检查是否在客户端环境
 */
function isClient(): boolean {
    return typeof window !== 'undefined';
}

/**
 * 初始化ONNX服务
 */
export async function initOnnxService(onProgress?: (progress: number) => void): Promise<void> {
    if (!isClient()) {
        throw new Error('ONNX service can only be initialized in client environment');
    }

    if (isInitialized || isLoading) return;

    try {
        isLoading = true;
        onProgress?.(10);

        console.log('开始初始化ONNX服务...');

        // 初始化简化分词器
        console.log('初始化分词器...');
        onProgress?.(30);
        tokenizer = new SimpleTokenizer();
        console.log('分词器初始化完成');

        // 加载ONNX模型
        console.log('加载ONNX模型...');
        onProgress?.(60);

        try {
            session = await InferenceSession.create(MODEL_CONFIG.modelPath, {
                executionProviders: ['webgl', 'cpu'],
                graphOptimizationLevel: 'all',
            });
            console.log('ONNX模型加载完成');
        } catch (modelError) {
            console.warn('无法加载指定的ONNX模型，使用演示模式');
            // 在演示模式下，我们仍然可以测试分词功能
            session = null;
        }

        onProgress?.(100);
        isInitialized = true;
        console.log('ONNX服务初始化完成');
    } catch (error) {
        console.error('ONNX服务初始化失败:', error);
        throw error;
    } finally {
        isLoading = false;
    }
}

/**
 * 检查ONNX服务是否就绪
 */
export function isOnnxServiceReady(): boolean {
    return isClient() && isInitialized && tokenizer !== null;
}

/**
 * 生成ONNX响应
 */
export async function generateOnnxResponse(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void
): Promise<void> {
    if (!isClient()) {
        throw new Error('ONNX response generation can only be used in client environment');
    }

    if (!isOnnxServiceReady()) {
        throw new Error('ONNX服务未就绪，请先初始化');
    }

    try {
        // 构建对话历史
        let conversation = '';
        for (const msg of history) {
            if (msg.role === 'user') {
                conversation += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
            } else {
                conversation += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
            }
        }
        conversation += `<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;

        console.log('对话上下文:', conversation);

        // 如果没有模型，使用演示响应
        if (!session) {
            console.log('演示模式：生成模拟响应');
            const demoResponses = [
                '这是一个演示响应。',
                '由于ONNX模型文件不存在，我正在演示模式下运行。',
                '请确保将正确的ONNX模型文件放置在 /public/models/ 目录下。',
                '当前使用的是简化分词器进行文本处理。',
                '关于您的问题，我建议您查看相关的技术文档。',
                '这是一个基于ONNX Runtime的AI助手演示。'
            ];

            const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];

            // 模拟流式输出
            for (const char of response) {
                onChunk(char);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            return;
        }

        // 分词
        const inputTokens = tokenizer!.encode(conversation);
        console.log('输入tokens:', inputTokens.slice(0, 10), '... (总长度:', inputTokens.length, ')');

        // 截断到最大长度
        const maxInputLength = MODEL_CONFIG.maxLength - 100;
        const truncatedTokens = inputTokens.slice(-maxInputLength);

        let currentTokens = [...truncatedTokens];
        let generatedText = '';

        // 逐token生成
        for (let i = 0; i < 50; i++) { // 最多生成50个token
            try {
                // 准备输入张量
                const inputTensor = new Tensor(
                    'int64',
                    new BigInt64Array(currentTokens.map(id => BigInt(id))),
                    [1, currentTokens.length]
                );

                // 创建 attention_mask (全为1，表示所有token都需要注意)
                const attentionMask = new Tensor(
                    'int64',
                    new BigInt64Array(currentTokens.length).fill(BigInt(1)),
                    [1, currentTokens.length]
                );

                // 运行推理 - 提供所需的输入
                const outputs = await session.run({
                    input_ids: inputTensor,
                    attention_mask: attentionMask
                });

                const logits = outputs.logits;

                // 获取最后一个位置的logits
                const logitsData = logits.data as Float32Array;
                const seqLength = currentTokens.length;
                const vocabSize = MODEL_CONFIG.vocabSize;

                // 提取最后一个token位置的logits
                const startIdx = (seqLength - 1) * vocabSize;
                const endIdx = startIdx + vocabSize;
                const lastTokenLogits = logitsData.slice(startIdx, endIdx);

                const lastLogitsTensor = new Tensor('float32', lastTokenLogits, [vocabSize]);

                // 采样下一个token
                const nextTokenId = sampleToken(lastLogitsTensor, MODEL_CONFIG.temperature, MODEL_CONFIG.topP);

                // 检查是否为结束token
                if (nextTokenId === tokenizer!.eosTokenId) {
                    break;
                }

                // 解码token
                const tokenText = tokenizer!.decode([nextTokenId]);

                // 过滤特殊token
                if (!tokenText.includes('<|') && !tokenText.includes('|>') && tokenText !== '[UNK]') {
                    generatedText += tokenText;
                    onChunk(tokenText);
                }

                // 添加到当前tokens
                currentTokens.push(nextTokenId);

                // 防止序列过长
                if (currentTokens.length > MODEL_CONFIG.maxLength) {
                    break;
                }

                // 添加小延迟以模拟流式输出
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (inferenceError) {
                console.error('推理步骤出错:', inferenceError);
                // 如果推理失败，回退到演示模式
                const fallbackText = '推理过程中遇到问题，请检查模型配置。';
                for (const char of fallbackText) {
                    onChunk(char);
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                break;
            }
        }

        console.log('生成完成:', generatedText);
    } catch (error) {
        console.error('生成响应时出错:', error);
        // 提供友好的错误回复
        const errorMessage = '抱歉，生成回复时遇到了问题。请稍后再试。';
        for (const char of errorMessage) {
            onChunk(char);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}

/**
 * 采样函数 - 使用temperature和top-p采样
 */
function sampleToken(logits: Tensor, temperature: number, topP: number): number {
    const logitsArray = Array.from(logits.data as Float32Array);

    // 应用temperature
    const scaledLogits = logitsArray.map(logit => logit / temperature);

    // 计算softmax
    const maxLogit = Math.max(...scaledLogits);
    const expLogits = scaledLogits.map(logit => Math.exp(logit - maxLogit));
    const sumExp = expLogits.reduce((sum, exp) => sum + exp, 0);
    const probs = expLogits.map(exp => exp / sumExp);

    // Top-p采样
    const sortedIndices = probs
        .map((prob, index) => ({ prob, index }))
        .sort((a, b) => b.prob - a.prob);

    let cumulativeProb = 0;
    const topPIndices = [];

    for (const item of sortedIndices) {
        cumulativeProb += item.prob;
        topPIndices.push(item.index);
        if (cumulativeProb >= topP) break;
    }

    // 从top-p候选中随机选择
    const randomIndex = Math.floor(Math.random() * topPIndices.length);
    return topPIndices[randomIndex];
}

/**
 * 清理ONNX服务
 */
export function cleanupOnnxService(): void {
    if (session) {
        session = null;
    }
    tokenizer = null;
    isInitialized = false;
    isLoading = false;
    console.log('ONNX服务已清理');
}