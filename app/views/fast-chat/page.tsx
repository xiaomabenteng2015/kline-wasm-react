'use client';
import React, { useState, useEffect } from 'react';
import styles from '../../styles/FastChatPage.module.css';
import CacheStatus from './components/CacheStatus';
import { fastChatService } from '../../services/fastChatService';

interface PerformanceData {
    initTime: number;
    timestamp: string;
    cacheHits: number;
    totalRequests: number;
}

export default function FastChatPage() {
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const initService = async () => {
            const startTime = performance.now();
            try {
                console.log('🚀 开始初始化 FastChatService...');
                await fastChatService.init();
                const endTime = performance.now();

                setPerformanceData({
                    initTime: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    cacheHits: 0,
                    totalRequests: 0
                });

                setIsReady(true);
                console.log(`✅ FastChatService 初始化完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
            } catch (error) {
                console.error('❌ FastChatService 初始化失败:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initService();
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !isReady || isGenerating) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsGenerating(true);

        // 添加用户消息
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const startTime = performance.now();

            // 使用 fastChatService 生成回复
            const result = await fastChatService.quickResponse(userMessage);

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // 添加AI回复，显示来源信息
            const responseText = `${result.response}\n\n[来源: ${result.source}, 模型: ${result.modelId}, 耗时: ${result.loadTime.toFixed(2)}ms]`;
            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

            // 更新性能数据
            setPerformanceData(prev => prev ? {
                ...prev,
                totalRequests: prev.totalRequests + 1,
                cacheHits: result.source === 'cache' ? prev.cacheHits + 1 : prev.cacheHits
            } : null);

            console.log(`💬 回复生成完成，耗时: ${responseTime.toFixed(2)}ms, 来源: ${result.source}`);
        } catch (error) {
            console.error('❌ 生成回复失败:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '抱歉，生成回复时出现错误。请稍后重试。'
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>🚀 快速聊天测试</h1>

            <div className={styles.dashboard}>
                <CacheStatus className={styles.cacheStatus} />

                <div className={styles.performancePanel}>
                    <h3>⚡ 性能监控</h3>
                    {performanceData && (
                        <div className={styles.metrics}>
                            <div className={styles.metric}>
                                <span className={styles.label}>初始化时间:</span>
                                <span className={styles.value}>{performanceData.initTime.toFixed(2)}ms</span>
                            </div>
                            <div className={styles.metric}>
                                <span className={styles.label}>总请求数:</span>
                                <span className={styles.value}>{performanceData.totalRequests}</span>
                            </div>
                            <div className={styles.metric}>
                                <span className={styles.label}>缓存命中:</span>
                                <span className={styles.value}>{performanceData.cacheHits}</span>
                            </div>
                            <div className={styles.metric}>
                                <span className={styles.label}>命中率:</span>
                                <span className={styles.value}>
                                    {performanceData.totalRequests > 0
                                        ? `${((performanceData.cacheHits / performanceData.totalRequests) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.chatContainer}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>正在初始化快速聊天服务...</p>
                    </div>
                ) : !isReady ? (
                    <div className={styles.error}>
                        <p>❌ 服务初始化失败，请刷新页面重试</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.messagesContainer}>
                            {messages.length === 0 ? (
                                <div className={styles.welcome}>
                                    <h3>🎉 欢迎使用快速聊天测试！</h3>
                                    <p>这个页面使用了 Service Worker + IndexedDB 优化的 FastChatService</p>
                                    <p>发送消息来测试性能提升效果吧！</p>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.message} ${styles[message.role]}`}
                                    >
                                        <div className={styles.messageContent}>
                                            {message.content.split('\n').map((line, i) => (
                                                <div key={i}>{line}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isGenerating && (
                                <div className={`${styles.message} ${styles.assistant}`}>
                                    <div className={styles.messageContent}>
                                        <div className={styles.typing}>正在生成回复...</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.inputContainer}>
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="输入消息测试快速聊天..."
                                className={styles.messageInput}
                                rows={3}
                                disabled={isGenerating}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isGenerating}
                                className={styles.sendButton}
                            >
                                {isGenerating ? '生成中...' : '发送'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}