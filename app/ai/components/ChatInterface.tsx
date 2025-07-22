'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/ChatInterface.module.css';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { generateResponse, initLLMService } from '../../services/llmService';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 确保服务已初始化
    useEffect(() => {
        const ensureServiceInitialized = async () => {
            try {
                await initLLMService();
                console.log('ChatInterface: 服务初始化确认完成');
            } catch (error) {
                console.error('ChatInterface: 服务初始化确认失败:', error);
            }
        };

        ensureServiceInitialized();
    }, []);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 处理发送消息
    const handleSendMessage = async (content: string) => {
        if (!content.trim() || isGenerating) return;

        setIsGenerating(true);

        // 添加用户消息
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);

        // 添加空的助手消息用于流式更新
        const assistantMessageId = `assistant-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        }]);

        try {
            // 确保服务已初始化
            await initLLMService();

            // 获取历史消息作为上下文
            const history = messages.slice(-6); // 最近6条消息作为上下文

            // 生成回复（流式）
            let fullResponse = '';
            await generateResponse(content, history, (chunk: string) => {
                fullResponse += chunk;
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: fullResponse }
                        : msg
                ));
            });

        } catch (error) {
            // 移除空的助手消息并添加错误消息
            setMessages(prev => {
                const filtered = prev.filter(msg => msg.content.trim() !== '');
                return [...filtered, {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: '抱歉，生成回复时出现了问题。系统已切换到备用模式，请重新发送消息。',
                    timestamp: Date.now()
                }];
            });
            console.error('生成回复失败:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={styles.container}>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
            <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isGenerating}
            // placeholder={isGenerating ? "AI正在思考中..." : "输入你的问题..."}
            />
        </div>
    );
}