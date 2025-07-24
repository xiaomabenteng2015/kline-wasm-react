'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from '../../../styles/OnnxChatInterface.module.css';
import MessageBubble from '../components/MessageBubble';
import { generateOnnxResponse } from '../../../services/onnxService';
import { OnnxMessage } from '../../../types/onnx';

export default function OnnxChatInterface() {
    const [messages, setMessages] = useState<OnnxMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentResponse]);

    // 发送消息
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isGenerating) return;

        const userMessage: OnnxMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsGenerating(true);
        setCurrentResponse('');

        try {
            // 准备历史消息
            const history = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            let fullResponse = '';

            await generateOnnxResponse(
                userMessage.content,
                history,
                (chunk: string) => {
                    fullResponse += chunk;
                    setCurrentResponse(fullResponse);
                }
            );

            // 添加完整的助手回复
            const assistantMessage: OnnxMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: fullResponse,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMessage]);
            setCurrentResponse('');

        } catch (error) {
            console.error('生成回复失败:', error);
            const errorMessage: OnnxMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '抱歉，生成回复时出现错误。请稍后重试。',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
            setCurrentResponse('');
        } finally {
            setIsGenerating(false);
        }
    };

    // 处理键盘事件
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 清空对话
    const handleClearChat = () => {
        setMessages([]);
        setCurrentResponse('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.status}>
                    <div className={styles.statusIndicator}></div>
                    <span>ONNX AI 已就绪</span>
                </div>
                <button
                    className={styles.clearButton}
                    onClick={handleClearChat}
                    disabled={isGenerating}
                >
                    清空对话
                </button>
            </div>

            <div className={styles.messagesContainer}>
                <div className={styles.messages}>
                    {messages.length === 0 && (
                        <div className={styles.welcomeMessage}>
                            <div className={styles.welcomeIcon}>🤖</div>
                            <h3>欢迎使用 ONNX AI 助手</h3>
                            <p>我是基于 ONNX Runtime 的高性能AI助手，专注于加密货币和K线分析。</p>
                            <div className={styles.suggestions}>
                                <button
                                    className={styles.suggestionButton}
                                    onClick={() => setInputValue('请解释一下什么是K线图？')}
                                >
                                    什么是K线图？
                                </button>
                                <button
                                    className={styles.suggestionButton}
                                    onClick={() => setInputValue('如何分析加密货币的价格趋势？')}
                                >
                                    如何分析价格趋势？
                                </button>
                                <button
                                    className={styles.suggestionButton}
                                    onClick={() => setInputValue('什么是技术指标？')}
                                >
                                    什么是技术指标？
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))}

                    {isGenerating && currentResponse && (
                        <MessageBubble
                            message={{
                                id: 'generating',
                                role: 'assistant',
                                content: currentResponse,
                                timestamp: Date.now()
                            }}
                            isGenerating={true}
                        />
                    )}

                    {isGenerating && !currentResponse && (
                        <div className={styles.typingIndicator}>
                            <div className={styles.typingDots}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span className={styles.typingText}>AI正在思考...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className={styles.inputArea}>
                <div className={styles.inputContainer}>
                    <div className={styles.inputWrapper}>
                        <textarea
                            ref={inputRef}
                            className={styles.messageInput}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="输入您的问题...（按 Enter 发送，Shift+Enter 换行）"
                            disabled={isGenerating}
                            rows={1}
                        />
                        {inputValue.trim() && (
                            <button
                                type="button"
                                className={styles.clearInputButton}
                                onClick={() => setInputValue('')}
                                title="清空输入"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <button
                        className={styles.sendButton}
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isGenerating}
                        title={isGenerating ? '正在发送...' : '发送消息'}
                    >
                        {isGenerating ? (
                            <div className={styles.loadingSpinner}>
                                <div className={styles.spinner}></div>
                            </div>
                        ) : (
                            <svg className={styles.sendIcon} viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
                                    fill="currentColor"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}