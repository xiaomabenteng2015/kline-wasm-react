'use client';
import React from 'react';
import styles from '../../../styles/OnnxModelStatus.module.css';

interface OnnxModelStatusProps {
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  onLoadModel: () => void;
}

export default function OnnxModelStatus({
  isLoading,
  loadingProgress,
  error,
  onLoadModel
}: OnnxModelStatusProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>
          🚀
        </div>

        <h2 className={styles.title}>ONNX AI 模型</h2>

        <p className={styles.description}>
          基于 ONNX Runtime 的高性能推理引擎，提供更快的响应速度和更低的资源占用。
          首次加载需要下载模型文件，之后将缓存在浏览器中。
        </p>

        {error && (
          <div className={styles.error}>
            <div className={styles.errorIcon}>⚠️</div>
            <div>
              <p className={styles.errorTitle}>加载失败</p>
              <p className={styles.errorMessage}>{error}</p>
              <p className={styles.errorHint}>请检查网络连接或尝试刷新页面</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${loadingProgress}%` }}
              >
                <div className={styles.progressGlow}></div>
              </div>
            </div>
            <div className={styles.progressText}>
              {loadingProgress.toFixed(1)}% 已加载
            </div>
            <div className={styles.loadingSteps}>
              {loadingProgress < 30 && <span className={styles.activeStep}>初始化服务...</span>}
              {loadingProgress >= 30 && loadingProgress < 60 && <span className={styles.activeStep}>加载分词器...</span>}
              {loadingProgress >= 60 && loadingProgress < 100 && <span className={styles.activeStep}>加载模型...</span>}
              {loadingProgress >= 100 && <span className={styles.activeStep}>准备就绪</span>}
            </div>
          </div>
        ) : (
          <button
            className={styles.loadButton}
            onClick={onLoadModel}
            disabled={isLoading}
          >
            <span className={styles.buttonIcon}>⚡</span>
            启动 ONNX 模型
          </button>
        )}

        <div className={styles.features}>
          <h3>技术特性</h3>
          <ul>
            <li>🔥 基于 ONNX Runtime Web 高性能推理</li>
            <li>🎯 使用 Transformers.js 专业分词器</li>
            <li>⚡ 更快的加载速度和响应时间</li>
            <li>💾 更低的内存占用</li>
            <li>🌊 流式文本生成</li>
          </ul>
        </div>
      </div>
    </div>
  );
}