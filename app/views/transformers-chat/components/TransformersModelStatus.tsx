'use client';

import styles from '../../../styles/TransformersModelStatus.module.css';

interface TransformersModelStatusProps {
    progress: number;
    loadingDuration: number;  // 修改参数名
    isModelReady: boolean;    // 修改参数名
    error: string | null;
    onRetry: () => void;
}

export default function TransformersModelStatus({
    progress,
    loadingDuration,  // 修改参数名
    isModelReady,     // 修改参数名
    error,
    onRetry
}: TransformersModelStatusProps) {
    // 错误状态显示
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

    // 安全的进度格式化函数
    const formatProgress = (value: number): string => {
        // 确保 value 是有效数字
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
            return '0.0';
        }
        // 确保值在 0-100 范围内
        const clampedValue = Math.max(0, Math.min(100, value));
        return clampedValue.toFixed(1);
    };

    // 安全的加载时间格式化函数
    const formatDuration = (seconds: number): string => {
        // 确保 seconds 是有效数字
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
            return '0秒';
        }

        const safeSeconds = Math.floor(seconds);
        if (safeSeconds < 60) {
            return `${safeSeconds}秒`;
        }
        const minutes = Math.floor(safeSeconds / 60);
        const remainingSeconds = safeSeconds % 60;
        return `${minutes}分${remainingSeconds}秒`;
    };

    // 安全的进度值处理
    const safeProgress = typeof progress === 'number' && !isNaN(progress) && isFinite(progress) ? progress : 0;
    const safeDuration = typeof loadingDuration === 'number' && !isNaN(loadingDuration) ? loadingDuration : 0;

    return (
        <div className={styles.container}>
            <div className={styles.loadingCard}>
                <h3>正在加载 Transformers.js 模型...</h3>

                {/* 加载时间显示 */}
                <div className={styles.loadingTime}>
                    已加载: {formatDuration(safeDuration)}
                </div>

                {/* 进度条 */}
                <div className={styles.progressContainer}>
                    <div
                        className={styles.progressBar}
                        style={{
                            width: `${Math.max(0, Math.min(100, safeProgress))}%`,
                            transition: 'width 0.3s ease-in-out'
                        }}
                    />
                </div>

                {/* 进度百分比显示 */}
                <div className={styles.progressText}>
                    <p>{formatProgress(safeProgress)}% 完成</p>
                </div>

                {/* 详细步骤指示器 */}
                <div className={styles.loadingSteps}>
                    <div className={safeProgress >= 10 ? styles.stepCompleted : styles.stepPending}>
                        {safeProgress >= 10 ? '✓' : '○'} 初始化环境
                    </div>
                    <div className={safeProgress >= 30 ? styles.stepCompleted : styles.stepPending}>
                        {safeProgress >= 30 ? '✓' : '○'} 加载分词器
                    </div>
                    <div className={safeProgress >= 60 ? styles.stepCompleted : styles.stepPending}>
                        {safeProgress >= 60 ? '✓' : '○'} 加载模型权重
                    </div>
                    <div className={safeProgress >= 90 ? styles.stepCompleted : styles.stepPending}>
                        {safeProgress >= 90 ? '✓' : '○'} 模型优化
                    </div>
                    <div className={safeProgress >= 100 ? styles.stepCompleted : styles.stepPending}>
                        {safeProgress >= 100 ? '✓' : '○'} 准备就绪
                    </div>
                </div>

                {/* 加载提示 */}
                <div className={styles.loadingHint}>
                    {safeProgress < 100 ? (
                        <p>首次加载需要下载模型文件，请耐心等待...</p>
                    ) : (
                        <p>模型加载完成，即将进入聊天界面</p>
                    )}
                </div>
            </div>
        </div>
    );
}