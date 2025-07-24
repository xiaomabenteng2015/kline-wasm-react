'use client';

import { useState, useEffect } from 'react';
import { initTransformersService, isTransformersServiceReady } from '../../services/transformersService';
import TransformersModelStatus from './components/TransformersModelStatus';
import TransformersChatInterface from './components/TransformersChatInterface';
import styles from '../../styles/TransformersChatPage.module.css';

export default function TransformersChatPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isModelReady, setIsModelReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadModel = async () => {
            if (isTransformersServiceReady()) {
                setIsModelReady(true);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                await initTransformersService((progress) => {
                    setProgress(progress);
                });

                setIsModelReady(true);
            } catch (err) {
                console.error('Failed to load model:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        loadModel();
    }, []);

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
                    isLoading={isLoading}
                    progress={progress}
                    error={error}
                    onRetry={() => window.location.reload()}
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