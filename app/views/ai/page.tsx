'use client';
import React, { useState, useEffect } from 'react';
import styles from '../../styles/AIPage.module.css';
import ChatInterface from './components/ChatInterface';
import ModelStatus from './components/ModelStatus';
import ErrorBoundary from './components/ErrorBoundary';
import { initLLMService, isModelLoaded, loadModel } from '../../services/llmService';
import { runDiagnostics } from '../../services/diagnostics';

// 调试信息
console.log('AI页面加载中...');

export default function AIPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [modelReady, setModelReady] = useState(false);
    const [serviceInitialized, setServiceInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 初始化LLM服务
    useEffect(() => {
        const init = async () => {
            try {
                // 运行诊断
                console.log('运行环境诊断...');
                const diagnostics = await runDiagnostics();
                console.log('诊断结果:', diagnostics);

                if (!diagnostics.environment.supported) {
                    console.warn('当前环境不完全支持WebLLM');
                    console.warn('建议:', diagnostics.environment.recommendations.join(', '));
                }

                if (!diagnostics.webllm.available) {
                    console.error('WebLLM模块不可用:', diagnostics.webllm.error);
                    throw new Error('WebLLM模块不可用: ' + diagnostics.webllm.error);
                }

                console.log('WebLLM API:', diagnostics.webllm.apis.join(', '));

                // 标记服务已初始化，但模型还未加载
                setServiceInitialized(true);
                setModelReady(false);

                console.log('环境检查完成，请点击按钮加载模型');
            } catch (err) {
                console.error('环境检查失败:', err);
                setError(err instanceof Error ? err.message : '环境检查失败');
                setServiceInitialized(true);
                setModelReady(false);
            }
        };

        init();
    }, []);

    // 加载模型
    const handleLoadModel = async () => {
        if (!serviceInitialized) {
            console.warn('服务尚未初始化，无法加载模型');
            return;
        }

        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);

        try {
            console.log('开始加载模型...');
            await loadModel({
                onProgress: (progress: number) => {
                    console.log(`加载进度: ${progress.toFixed(1)}%`);
                    setLoadingProgress(progress);
                }
            });
            console.log('模型加载完成');
            setModelReady(true);
        } catch (err) {
            console.error('模型加载失败:', err);
            setError(err instanceof Error ? err.message : '模型加载失败');
            setModelReady(false);
        } finally {
            setIsLoading(false);
        }
    };

    // 如果服务尚未初始化，显示加载状态
    if (!serviceInitialized) {
        return (
            <ErrorBoundary>
                <div className={styles.container}>
                    <h1 className={styles.title}>AI 助手</h1>
                    <div className={styles.content}>
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p>正在初始化AI服务...</p>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <div className={styles.container}>
                <h1 className={styles.title}>AI 助手</h1>

                <div className={styles.content}>
                    {!modelReady && (
                        <ModelStatus
                            isLoading={isLoading}
                            loadingProgress={loadingProgress}
                            error={error}
                            onLoadModel={handleLoadModel}
                        />
                    )}

                    {modelReady && serviceInitialized && (
                        <ChatInterface />
                    )}
                </div>

                <div className={styles.disclaimer}>
                    <p>注意：AI助手提供的分析仅供参考，不构成投资建议。请自行判断并承担投资风险。</p>
                </div>
            </div>
        </ErrorBoundary>
    );
}