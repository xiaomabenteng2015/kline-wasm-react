'use client';

import { useState, useEffect, useRef } from 'react';
import { initTransformersService, isTransformersServiceReady } from '../../services/transformersService';
import TransformersModelStatus from './components/TransformersModelStatus';
import TransformersChatInterface from './components/TransformersChatInterface';
import styles from '../../styles/TransformersChatPage.module.css';

export default function TransformersChatPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isModelReady, setIsModelReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingDuration, setLoadingDuration] = useState(0);

    // 使用 ref 来避免闭包问题
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // 清理计时器的函数
    const clearTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // 开始计时器的函数
    const startTimer = () => {
        clearTimer(); // 先清理之前的计时器
        const startTime = Date.now();
        startTimeRef.current = startTime;

        intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setLoadingDuration(elapsed);
            }
        }, 1000);
    };

    useEffect(() => {
        const loadModel = async () => {
            // 如果服务已经准备好，直接设置为就绪
            if (isTransformersServiceReady()) {
                setIsModelReady(true);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                setProgress(0);
                setLoadingDuration(0);
                setIsModelReady(false);

                // 开始计时
                startTimer();

                // 初始化 Transformers 服务
                await initTransformersService((progressValue) => {
                    console.log('Progress received:', progressValue);
                    // 只有当进度值是有效数字时才设置
                    if (typeof progressValue === 'number' &&
                        !isNaN(progressValue) &&
                        isFinite(progressValue) &&
                        progressValue >= 0 &&
                        progressValue <= 100) {
                        setProgress(progressValue);
                    }
                });

                // 确保进度设置为100%
                setProgress(100);

                // 验证服务是否真正就绪
                if (isTransformersServiceReady()) {
                    // 延迟一下让用户看到100%完成状态
                    setTimeout(() => {
                        setIsModelReady(true);
                        setIsLoading(false);
                        clearTimer(); // 在这里清理计时器
                    }, 500);
                } else {
                    throw new Error('模型初始化完成但服务未就绪');
                }

            } catch (err) {
                console.error('Failed to load model:', err);
                setError(err instanceof Error ? err.message : '未知错误');
                setIsLoading(false);
                setProgress(0);
                clearTimer();
            }
        };

        loadModel();

        // 清理函数
        return () => {
            clearTimer();
        };
    }, []); // 空依赖数组，只在组件挂载时执行一次

    // 重试函数
    const handleRetry = () => {
        setError(null);
        setProgress(0);
        setLoadingDuration(0);
        setIsModelReady(false);
        // 触发重新加载
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Transformers.js Chat</h1>
                <p className={styles.subtitle}>
                    基于 @xenova/transformers 的本地 AI 聊天 - 新方案对比
                </p>
            </div>

            {!isModelReady ? (
                <TransformersModelStatus
                    progress={progress}
                    loadingDuration={loadingDuration}
                    isModelReady={isModelReady}
                    error={error}
                    onRetry={handleRetry}
                />
            ) : (
                <TransformersChatInterface />
            )}

            <footer className={styles.footer}>
                <p>使用 Transformers.js 实现的客户端 AI 推理</p>
            </footer>
        </div>
    );
}