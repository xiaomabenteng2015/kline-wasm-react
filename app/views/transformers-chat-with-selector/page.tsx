'use client';

import { useState, useEffect, useRef } from 'react';
import {
    initModelSelectorService,
    isModelSelectorServiceReady,
    isModelSelectorServiceLoading,
    getCurrentModelInfo,
    AVAILABLE_MODELS
} from '../../services/transformersModelSelectorService';
import TransformersChatInterfaceWithSelector from './components/TransformersChatInterfaceWithSelector';
import ModelSelector from './components/ModelSelector';
import TransformersModelStatus from '../transformers-chat/components/TransformersModelStatus';
import ModelUrlDebugger from '../../components/ModelUrlDebugger';
import styles from '../../styles/AIPage.module.css';

// 定义界面状态枚举
type InterfaceState = 'selecting' | 'loading' | 'ready' | 'error';

export default function TransformersChatWithSelectorPage() {
    const [progress, setProgress] = useState(0);
    const [loadingDuration, setLoadingDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [interfaceState, setInterfaceState] = useState<InterfaceState>('selecting');
    
    const loadingStartTime = useRef<number>(0);

    // 检查模型状态
    const isModelReady = isModelSelectorServiceReady();
    const isModelLoading = isModelSelectorServiceLoading();

    // 根据模型状态更新界面状态
    useEffect(() => {
        if (error) {
            setInterfaceState('error');
        } else if (isModelLoading) {
            setInterfaceState('loading');
        } else if (isModelReady && selectedModelId) {
            setInterfaceState('ready');
        } else {
            setInterfaceState('selecting');
        }
    }, [error, isModelLoading, isModelReady, selectedModelId]);

    // 处理模型选择和加载
    const handleModelSelect = async (modelId: string) => {
        try {
            setError(null);
            setProgress(0);
            setLoadingDuration(0);
            loadingStartTime.current = Date.now();
            setSelectedModelId(modelId);
            setInterfaceState('loading');

            await initModelSelectorService(modelId, (progressValue: number) => {
                setProgress(progressValue);
                setLoadingDuration(Date.now() - loadingStartTime.current);
            });

            if (isModelSelectorServiceReady()) {
                setInterfaceState('ready');
            } else {
                throw new Error('模型加载完成但服务未就绪');
            }

        } catch (err) {
            console.error('模型加载失败:', err);
            setError(err instanceof Error ? err.message : '模型加载失败');
            setInterfaceState('error');
        }
    };

    // 处理重试
    const handleRetry = () => {
        if (selectedModelId) {
            handleModelSelect(selectedModelId);
        }
    };

    // 处理重新选择模型
    const handleReselect = () => {
        setSelectedModelId('');
        setInterfaceState('selecting');
        setError(null);
        setProgress(0);
        setLoadingDuration(0);
    };

    // 根据状态渲染不同的界面
    const renderContent = () => {
        switch (interfaceState) {
            case 'selecting':
                return (
                    <div className={styles.container}>
                        <h1 className={styles.title}>Transformers.js 聊天助手 (模型选择版)</h1>
                        <div className={styles.content}>
                            <ModelSelector
                                onModelSelect={handleModelSelect}
                                disabled={false}
                                selectedModelId={selectedModelId}
                            />
                            <ModelUrlDebugger />
                        </div>
                        <div className={styles.disclaimer}>
                            注意：模型在浏览器中本地运行，首次加载可能需要一些时间。不同模型的对话能力和响应质量会有所差异。
                        </div>
                    </div>
                );

            case 'loading':
                return (
                    <div className={styles.container}>
                        <h1 className={styles.title}>正在加载模型...</h1>
                        <div className={styles.content}>
                            <TransformersModelStatus
                                progress={progress}
                                loadingDuration={loadingDuration}
                                isModelReady={false}
                                error={null}
                                onRetry={handleRetry}
                            />
                        </div>
                    </div>
                );

            case 'error':
                return (
                    <div className={styles.container}>
                        <h1 className={styles.title}>模型加载失败</h1>
                        <div className={styles.content}>
                            <TransformersModelStatus
                                progress={progress}
                                loadingDuration={loadingDuration}
                                isModelReady={false}
                                error={error}
                                onRetry={handleRetry}
                            />
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button
                                    onClick={handleReselect}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    重新选择模型
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'ready':
                return (
                    <div className={styles.container}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            padding: '0 20px'
                        }}>
                            <h1 className={styles.title} style={{ margin: 0 }}>
                                当前模型: {getCurrentModelInfo()?.name}
                            </h1>
                            <button
                                onClick={handleReselect}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                更换模型
                            </button>
                        </div>
                        <div className={styles.content}>
                            <TransformersChatInterfaceWithSelector />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return renderContent();
}