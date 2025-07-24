'use client';

import styles from '../../../styles/TransformersModelStatus.module.css';

interface TransformersModelStatusProps {
    isLoading: boolean;
    progress: number;
    error: string | null;
    onRetry: () => void;
}

export default function TransformersModelStatus({
    isLoading,
    progress,
    error,
    onRetry
}: TransformersModelStatusProps) {
    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorCard}>
                    <h3>模型加载失败</h3>
                    <p>{error}</p>
                    <button onClick={onRetry} className={styles.retryButton}>
                        重试
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.loadingCard}>
                <h3>正在加载 Transformers.js 模型...</h3>
                <div className={styles.progressContainer}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p>{progress}% 完成</p>
                <div className={styles.loadingSteps}>
                    <div className={progress >= 10 ? styles.stepCompleted : styles.stepPending}>
                        ✓ 初始化环境
                    </div>
                    <div className={progress >= 30 ? styles.stepCompleted : styles.stepPending}>
                        ✓ 加载分词器
                    </div>
                    <div className={progress >= 60 ? styles.stepCompleted : styles.stepPending}>
                        ✓ 加载模型
                    </div>
                    <div className={progress >= 100 ? styles.stepCompleted : styles.stepPending}>
                        ✓ 准备就绪
                    </div>
                </div>
            </div>
        </div>
    );
}