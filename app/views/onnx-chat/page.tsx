'use client';
import React, { useState, useEffect } from 'react';
import styles from '../../styles/OnnxChatPage.module.css';
import OnnxChatInterface from './components/OnnxChatInterface';
import OnnxModelStatus from './components/OnnxModelStatus';
import ErrorBoundary from '../ai/components/ErrorBoundary';
import { initOnnxService, isOnnxServiceReady } from '../../services/onnxService';

export default function OnnxChatPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [modelReady, setModelReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 检查服务状态
    useEffect(() => {
        setModelReady(isOnnxServiceReady());
    }, []);

    // 加载模型
    const handleLoadModel = async () => {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);

        try {
            console.log('开始加载ONNX模型...');
            await initOnnxService((progress: number) => {
                console.log(`加载进度: ${progress.toFixed(1)}%`);
                setLoadingProgress(progress);
            });
            console.log('ONNX模型加载完成');
            setModelReady(true);
        } catch (err) {
            console.error('ONNX模型加载失败:', err);
            setError(err instanceof Error ? err.message : 'ONNX模型加载失败');
            setModelReady(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ErrorBoundary>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>ONNX AI 助手</h1>
                    <p className={styles.subtitle}>基于 ONNX Runtime 的高性能聊天助手</p>
                </div>

                <div className={styles.content}>
                    {!modelReady && (
                        <OnnxModelStatus
                            isLoading={isLoading}
                            loadingProgress={loadingProgress}
                            error={error}
                            onLoadModel={handleLoadModel}
                        />
                    )}

                    {modelReady && (
                        <OnnxChatInterface />
                    )}
                </div>

                <div className={styles.footer}>
                    <p>注意：AI助手提供的分析仅供参考，不构成投资建议。请自行判断并承担投资风险。</p>
                </div>
            </div>
        </ErrorBoundary>
    );
}