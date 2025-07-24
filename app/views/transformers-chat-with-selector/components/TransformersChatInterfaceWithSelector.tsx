'use client';

import { useState, useEffect, useRef } from 'react';
import {
    generateModelSelectorResponse,
    isModelSelectorServiceReady,
    getCurrentModelInfo,
    AVAILABLE_MODELS
} from '../../../services/transformersModelSelectorService';
import styles from '../../../styles/TransformersChatInterfaceWithSelect.module.css';

// Message 接口
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isTyping?: boolean;
}

export default function TransformersChatInterfaceWithSelector() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 检查模型是否就绪
    const isModelReady = isModelSelectorServiceReady();

    // 初始化欢迎消息
    useEffect(() => {
        if (isModelReady && messages.length === 0) {
            const selectedModel = getCurrentModelInfo();
            setMessages([{
                id: Date.now().toString(),
                role: 'assistant',
                content: `${selectedModel?.name} 模型已准备就绪！您现在可以开始对话了。`,
                timestamp: new Date()
            }]);
        }
    }, [isModelReady, messages.length]);

    // 滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 自动调整文本框高度
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    // 发送消息
    const handleSendMessage = async () => {
        if (!input.trim() || !isModelReady || isGenerating) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };
    
        // 立即显示用户消息并清空输入框
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsGenerating(true);
    
        // 重置文本框高度
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    
        // 准备历史消息
        const history = [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    
        // 延迟显示AI等待气泡
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isTyping: true
            };
    
            setMessages(prev => [...prev, assistantMessage]);
    
            // 开始生成AI回复
            generateModelSelectorResponse(
                userMessage.content,
                history.slice(0, -1),
                (chunk: string) => {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === assistantMessage.id
                                ? { 
                                    ...msg, 
                                    content: msg.content + chunk, 
                                    isTyping: false,
                                    timestamp: new Date()
                                }
                                : msg
                        )
                    );
                }
            ).catch(error => {
                console.error('Error generating response:', error);
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessage.id
                            ? { 
                                ...msg, 
                                content: '抱歉，生成回复时出现错误。', 
                                isTyping: false,
                                timestamp: new Date()
                            }
                            : msg
                    )
                );
            }).finally(() => {
                setIsGenerating(false);
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessage.id
                            ? { ...msg, timestamp: new Date() }
                            : msg
                    )
                );
            });
        }, 500);
    };

    // 处理键盘事件
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={styles.chatContainer}>
            {/* 消息区域 */}
            <div className={styles.messagesContainer}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`${styles.messageWrapper} ${styles[message.role + 'Wrapper']}`}
                    >
                        {/* 头像 */}
                        <div className={styles.avatar}>
                            {message.role === 'user' ? (
                                <div className={styles.userAvatar}>👤</div>
                            ) : (
                                <div className={styles.assistantAvatar}>🤖</div>
                            )}
                        </div>
                        
                        {/* 消息气泡 */}
                        <div className={`${styles.message} ${styles[message.role]}`}>
                            <div className={styles.messageContent}>
                                {message.isTyping && message.content === '' ? (
                                    <div className={styles.typingIndicator}>
                                        <div className={styles.typingDots}>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                ) : (
                                    message.content
                                )}
                            </div>
                            <div className={styles.messageTime}>
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 - 直接复用 TransformersChatInterface 的实现 */}
            <div className={styles.inputContainer}>
                <div className={styles.inputWrapper}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入您的消息... (Enter 发送，Shift+Enter 换行)"
                        className={styles.messageInput}
                        disabled={isGenerating}
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isGenerating}
                        className={styles.sendButton}
                    >
                        {isGenerating ? (
                            <span className={styles.sendingIcon}>⏳</span>
                        ) : (
                            <span className={styles.sendIcon}>➤</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}