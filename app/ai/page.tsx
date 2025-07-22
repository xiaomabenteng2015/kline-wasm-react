'use client';
import React, { useState, useEffect } from 'react';
import styles from '../styles/AIPage.module.css';
import ChatInterface from './components/ChatInterface';
import ModelStatus from './components/ModelStatus';
import ErrorBoundary from './components/ErrorBoundary';
import { initLLMService, isModelLoaded, loadModel } from '../services/llmService';
import { runDiagnostics } from '../services/diagnostics';

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
                    console.warn('当前环境不完全支持WebLLM，可能会使用备用服务');
                    console.warn('建议:', diagnostics.environment.recommendations.join(', '));
                }

                if (!diagnostics.webllm.available) {
                    console.error('WebLLM模块不可用:', diagnostics.webllm.error);
                    throw new Error('WebLLM模块不可用: ' + diagnostics.webllm.error);
                }

                console.log('WebLLM API:', diagnostics.webllm.apis.join(', '));

                // 初始化服务
                console.log('正在初始化LLM服务...');
                await initLLMService();
                console.log('LLM服务初始化完成');
                setServiceInitialized(true);

                // 检查模型是否已加载
                const loaded = await isModelLoaded();
                console.log('模型加载状态:', loaded);
                setModelReady(loaded);
            } catch (err) {
                console.error('LLM服务初始化失败:', err);
                setError(err instanceof Error ? err.message : '初始化失败');
                // 即使初始化失败，也设置为已初始化，因为有备用服务
                setServiceInitialized(true);
                setModelReady(true);
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
            console.warn('WebLLM加载失败，将使用备用聊天服务:', err);
            // 即使WebLLM加载失败，也设置为就绪状态，因为有备用服务
            setModelReady(true);
            setError(null); // 不显示错误，因为备用服务可用
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