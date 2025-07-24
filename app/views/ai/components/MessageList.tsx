'use client';
import React from 'react';
import styles from '../../../styles/ChatInterface.module.css';
import { Message } from './ChatInterface';

interface MessageListProps {
    messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
    // 格式化时间戳
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.messageList}>
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`${styles.messageItem} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage
                        }`}
                >
                    <div>
                        <div
                            className={`${styles.messageBubble} ${message.role === 'user' ? styles.userBubble : styles.assistantBubble
                                }`}
                        >
                            {message.content || (
                                <div className={styles.typing}>
                                    <div className={styles.typingDot}></div>
                                    <div className={styles.typingDot}></div>
                                    <div className={styles.typingDot}></div>
                                </div>
                            )}
                        </div>
                        <div className={styles.timestamp}>
                            {formatTimestamp(message.timestamp)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}