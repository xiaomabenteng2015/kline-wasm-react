'use client';
import React from 'react';
import styles from '../../styles/ModelStatus.module.css';

interface ModelStatusProps {
    isLoading: boolean;
    loadingProgress: number;
    error: string | null;
    onLoadModel: () => void;
}

export default function ModelStatus({
    isLoading,
    loadingProgress,
    error,
    onLoadModel
}: ModelStatusProps) {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>AI模型加载</h2>

                <p className={styles.description}>
                    为了提供智能对话功能，需要加载Qwen2-1.5B模型。
                    首次加载可能需要几分钟时间，之后将缓存在浏览器中加快加载速度。
                    请确保网络连接稳定，并使用支持WebLLM的现代浏览器。
                </p>

                {error && (
                    <div className={styles.error}>
                        <p>加载失败: {error}</p>
                        <p>请检查网络连接或尝试使用Chrome/Edge浏览器。</p>
                    </div>
                )}

                {isLoading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        <div className={styles.progressText}>
                            {loadingProgress.toFixed(1)}% 已加载
                        </div>
                        <p className={styles.loadingMessage}>
                            正在加载模型，请耐心等待...
                        </p>
                    </div>
                ) : (
                    <button
                        className={styles.loadButton}
                        onClick={onLoadModel}
                        disabled={isLoading}
                    >
                        加载AI模型
                    </button>
                )}

                <div className={styles.requirements}>
                    <h3>系统要求</h3>
                    <ul>
                        <li>推荐使用Chrome或Edge浏览器</li>
                        <li>至少4GB可用内存</li>
                        <li>稳定的网络连接</li>
                        <li>支持WebGPU可获得更好性能（可选）</li>
                    </ul>
                    <p className={styles.note}>
                        如果遇到问题，请尝试刷新页面或使用Chrome/Edge浏览器。
                    </p>
                </div>
            </div>
        </div>
    );
}