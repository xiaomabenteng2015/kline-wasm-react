'use client';
import React from 'react';
import styles from '../../styles/MessageBubble.module.css';
import { OnnxMessage } from '../../types/onnx';

interface MessageBubbleProps {
  message: OnnxMessage;
  isGenerating?: boolean;
}

export default function MessageBubble({ message, isGenerating = false }: MessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string) => {
    // 简单的markdown渲染
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`${styles.messageContainer} ${styles[message.role]}`}>
      <div className={styles.avatar}>
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      
      <div className={styles.messageContent}>
        <div className={styles.messageHeader}>
          <span className={styles.sender}>
            {message.role === 'user' ? '您' : 'ONNX AI'}
          </span>
          <span className={styles.timestamp}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        
        <div 
          className={`${styles.messageText} ${isGenerating ? styles.generating : ''}`}
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
        
        {isGenerating && (
          <div className={styles.cursor}>|</div>
        )}
      </div>
    </div>
  );
}