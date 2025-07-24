'use client';

import { useState, useRef, useEffect } from 'react';
import { generateTransformersResponse } from '../../services/transformersService';
import styles from '../../styles/TransformersChatInterface.module.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function TransformersChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isGenerating) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsGenerating(true);

        // 准备历史消息
        const history = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 创建助手消息
        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        try {
            await generateTransformersResponse(
                userMessage.content,
                history,
                (chunk: string) => {
                    setMessages(prev => 
                        prev.map(msg => 
                            msg.id === assistantMessage.id 
                                ? { ...msg, content: msg.content + chunk }
                                : msg
                        )
                    );
                }
            );
        } catch (error) {
            console.error('Error generating response:', error);
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === assistantMessage.id 
                        ? { ...msg, content: '抱歉，生成回复时出现错误。' }
                        : msg
                )
            );
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

    const clearConversation = () => {
        setMessages([]);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Transformers.js 聊天</h2>
                <button 
                    onClick={clearConversation}
                    className={styles.clearButton}
                    disabled={messages.length === 0}
                >
                    清空对话
                </button>
            </div>

            <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>开始与基于 Transformers.js 的 AI 对话吧！</p>
                        <p className={styles.hint}>这个版本使用了官方的 Hugging Face 分词器</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div 
                            key={message.id} 
                            className={`${styles.message} ${styles[message.role]}`}
                        >
                            <div className={styles.messageContent}>
                                {message.content}
                            </div>
                            <div className={styles.messageTime}>
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

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