'use client';

import { useState, useEffect, useRef } from 'react';
import {
    initModelSelectorService,
    generateModelSelectorResponse,
    isModelSelectorServiceReady,
    isModelSelectorServiceLoading,
    getCurrentModelName,
    getCurrentModelInfo,
    AVAILABLE_MODELS
} from '../../../services/transformersModelSelectorService';
import ModelSelector from './ModelSelector';
import MessageInput from '../../ai/components/MessageInput';
import TransformersModelStatus from '../../transformers-chat/components/TransformersModelStatus';
import ModelUrlDebugger from '../../../components/ModelUrlDebugger';
import styles from '../../../styles/TransformersChatInterfaceWithSelect.module.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function TransformersChatInterfaceWithSelector() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingDuration, setLoadingDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [modelInitialized, setModelInitialized] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const loadingStartTime = useRef<number>(0);

    // 滚动到最新消息 - 只在模型已初始化且有消息时滚动
    useEffect(() => {
        // 只有在模型已初始化并且有消息时才滚动
        if (modelInitialized && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, modelInitialized]);

    // 检查模型状态
    const isModelReady = isModelSelectorServiceReady();
    const isModelLoading = isModelSelectorServiceLoading();

    // 处理模型选择和加载
    const handleModelSelect = async (modelId: string) => {
        try {
            setError(null);
            setProgress(0);
            setLoadingDuration(0);
            loadingStartTime.current = Date.now();
            setSelectedModelId(modelId);
            // 开始加载过程，但还没有初始化完成
            setModelInitialized(false);

            const selectedModel = AVAILABLE_MODELS.find(model => model.id === modelId);

            // 添加系统消息
            setMessages([{
                role: 'assistant',
                content: `正在加载 ${selectedModel?.name} 模型，请稍候...`
            }]);

            await initModelSelectorService(modelId, (progressValue: number) => {
                setProgress(progressValue);
                setLoadingDuration(Date.now() - loadingStartTime.current);
            });

            // 只有在模型真正加载完成后才设置为已初始化
            if (isModelSelectorServiceReady()) {
                setModelInitialized(true);

                // 更新系统消息
                setMessages([{
                    role: 'assistant',
                    content: `${selectedModel?.name} 模型加载完成！您现在可以开始对话了。`
                }]);
            } else {
                throw new Error('模型加载完成但服务未就绪');
            }

        } catch (err) {
            console.error('模型加载失败:', err);
            setError(err instanceof Error ? err.message : '模型加载失败');
            setModelInitialized(false);
            setMessages([{
                role: 'assistant',
                content: '模型加载失败，请重试或选择其他模型。'
            }]);
        }
    };

    // 处理重试
    const handleRetry = () => {
        if (selectedModelId) {
            setError(null);
            setProgress(0);
            setLoadingDuration(0);
            handleModelSelect(selectedModelId);
        }
    };

    // 处理重新选择模型
    const handleReselect = () => {
        setSelectedModelId('');
        setModelInitialized(false);
        setMessages([]);
        setError(null);
        setProgress(0);
        setLoadingDuration(0);
        // 滚动到页面顶部，确保模型选择器可见
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 发送消息
    const handleSendMessage = async (message: string) => {
        if (!isModelReady || isGenerating) return;

        const userMessage: Message = { role: 'user', content: message };
        setMessages(prev => [...prev, userMessage]);

        // 创建助手消息占位符
        const assistantMessage: Message = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMessage]);

        setIsGenerating(true);

        try {
            let responseContent = '';

            await generateModelSelectorResponse(
                message,
                messages,
                (chunk: string) => {
                    responseContent += chunk;
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        { ...prev[prev.length - 1], content: responseContent }
                    ]);
                }
            );
        } catch (err) {
            console.error('生成响应失败:', err);
            setMessages(prev => [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], content: '抱歉，生成响应时出现错误。' }
            ]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* 固定在顶部的区域 */}
            <div className={styles.topSection}>
                {/* 模型选择器 - 在未选择模型时显示 */}
                {!selectedModelId && (
                    <>
                        <ModelSelector
                            onModelSelect={handleModelSelect}
                            disabled={isModelLoading}
                            selectedModelId={selectedModelId}
                        />
                        <ModelUrlDebugger />
                    </>
                )}

                {/* 模型状态 - 在加载过程中、加载完成或出错时显示 */}
                {selectedModelId && (isModelLoading || isModelReady || error) && (
                    <div>
                        <TransformersModelStatus
                            progress={progress}
                            loadingDuration={loadingDuration}
                            isModelReady={isModelReady}
                            error={error}
                            onRetry={handleRetry}
                        />

                        {/* 在出错时显示重新选择按钮 */}
                        {error && (
                            <div className={styles.errorActions}>
                                <button
                                    className={styles.reselectButton}
                                    onClick={handleReselect}
                                >
                                    重新选择模型
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 当前模型信息 - 在模型已加载时显示 */}
                {isModelReady && modelInitialized && (
                    <div className={styles.currentModel}>
                        <span>当前模型: {getCurrentModelInfo()?.name}</span>
                        <button
                            className={styles.changeModelButton}
                            onClick={handleReselect}
                        >
                            更换模型
                        </button>
                    </div>
                )}
            </div>

            {/* 聊天界面 - 在有消息时显示（包括加载消息） */}
            {messages.length > 0 && (
                <div className={styles.chatContainer}>
                    <div className={styles.messagesContainer}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage
                                    }`}
                            >
                                <div className={styles.messageContent}>
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 输入框 - 只在模型准备好时显示 */}
                    {isModelReady && modelInitialized && (
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            disabled={isGenerating}
                        />
                    )}
                </div>
            )}
        </div>
    );
}