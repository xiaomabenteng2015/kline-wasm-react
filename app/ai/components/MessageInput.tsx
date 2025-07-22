'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/ChatInterface.module.css';

interface MessageInputProps {
    onSendMessage: (message: string) => void;
    disabled: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 自动调整文本框高度
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');

            // 重置文本框高度
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className={styles.inputContainer} onSubmit={handleSubmit}>
            <textarea
                ref={textareaRef}
                className={styles.messageInput}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题..."
                disabled={disabled}
                rows={1}
            />
            <button
                type="submit"
                className={styles.sendButton}
                disabled={!message.trim() || disabled}
            >
                发送
            </button>
        </form>
    );
}