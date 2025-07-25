'use client';

import { useState, useEffect } from 'react';
import { modelCacheService } from '../../../services/cacheService';
import { fastChatService } from '../../../services/fastChatService';
import styles from '../../../styles/CacheStatus.module.css';

interface CacheStatusProps {
    className?: string;
}

interface CacheStats {
    modelCount: number;
    responseCount: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
}

export default function CacheStatus({ className }: CacheStatusProps) {
    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(new Map());
    const [serviceStatus, setServiceStatus] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        initializeStatus();

        // 监听在线状态
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 监听下载进度
        const handleProgress = (event: any) => {
            const { url, progress } = event.detail;
            setDownloadProgress(prev => new Map(prev.set(url, progress)));
        };

        window.addEventListener('sw-download-progress', handleProgress);

        // 定期更新状态
        const interval = setInterval(updateCacheStats, 10000); // 每10秒更新

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('sw-download-progress', handleProgress);
            clearInterval(interval);
        };
    }, []);

    const initializeStatus = async () => {
        setIsLoading(true);
        try {
            await updateCacheStats();
            await updateServiceStatus();
        } catch (error) {
            console.error('初始化状态失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateCacheStats = async () => {
        try {
            const stats = await modelCacheService.getCacheStats();
            setCacheStats(stats);
        } catch (error) {
            console.error('获取缓存统计失败:', error);
        }
    };

    const updateServiceStatus = async () => {
        try {
            const status = await fastChatService.getServiceStatus();
            setServiceStatus(status);
        } catch (error) {
            console.error('获取服务状态失败:', error);
        }
    };

    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number): string => {
        if (!timestamp) return '无';
        return new Date(timestamp).toLocaleString('zh-CN');
    };

    const clearCache = async () => {
        if (!confirm('确定要清理所有缓存吗？这将删除所有已缓存的模型和响应。')) {
            return;
        }

        setIsLoading(true);
        try {
            await fastChatService.clearCache();
            await updateCacheStats();
            await updateServiceStatus();
            setDownloadProgress(new Map());
            alert('缓存已清理完成');
        } catch (error) {
            console.error('清理缓存失败:', error);
            alert('清理缓存失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const exportCache = async () => {
        try {
            setIsLoading(true);
            const exportData = await modelCacheService.exportCache();

            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-cache-export-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('缓存数据已导出');
        } catch (error) {
            console.error('导出缓存失败:', error);
            alert('导出失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const preloadModel = async (modelId: string) => {
        setIsLoading(true);
        try {
            const success = await fastChatService.preloadModel(modelId);
            if (success) {
                alert(`模型 ${modelId} 预加载成功`);
                await updateCacheStats();
            } else {
                alert(`模型 ${modelId} 预加载失败`);
            }
        } catch (error) {
            console.error('预加载模型失败:', error);
            alert('预加载失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !cacheStats) {
        return (
            <div className={className}>
                <div className={`${styles.cacheStatus} ${styles.loading}`}>
                    <div className={styles.loadingSpinner}></div>
                    <span>正在加载缓存状态...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className={styles.cacheStatus}>
                {/* 在线状态 */}
                <div className={styles.statusSection}>
                    <h4>🌐 连接状态</h4>
                    <div className={styles.statusItem}>
                        <span className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`}></span>
                        <span>{isOnline ? '在线' : '离线'}</span>
                        {serviceStatus?.isInitialized && (
                            <span className={styles.serviceReady}>✅ 服务就绪</span>
                        )}
                    </div>
                </div>

                {/* 缓存统计 */}
                {cacheStats && (
                    <div className={styles.statusSection}>
                        <h4>📊 缓存统计</h4>
                        <div className={styles.statsGrid}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>模型数量:</span>
                                <span className={styles.statValue}>{cacheStats.modelCount}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>响应数量:</span>
                                <span className={styles.statValue}>{cacheStats.responseCount}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>总大小:</span>
                                <span className={styles.statValue}>{formatSize(cacheStats.totalSize)}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>最后更新:</span>
                                <span className={styles.statValue}>{formatDate(cacheStats.newestEntry)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 当前模型 */}
                {serviceStatus?.currentModel && (
                    <div className={styles.statusSection}>
                        <h4>🤖 当前模型</h4>
                        <div className={styles.currentModel}>
                            <span className={styles.modelName}>{serviceStatus.currentModel}</span>
                        </div>
                    </div>
                )}

                {/* 可用模型 */}
                {serviceStatus?.availableModels && (
                    <div className={styles.statusSection}>
                        <h4>📋 可用模型</h4>
                        <div className={styles.modelsList}>
                            {serviceStatus.availableModels.map((model: any) => (
                                <div key={model.id} className={styles.modelItem}>
                                    <div className={styles.modelInfo}>
                                        <span className={styles.modelName}>{model.name}</span>
                                        <span className={styles.modelSize}>{model.size}</span>
                                        <span className={styles.modelQuality}>{model.quality}</span>
                                    </div>
                                    {model.id !== 'instant' && (
                                        <button
                                            onClick={() => preloadModel(model.id)}
                                            className={styles.preloadBtn}
                                            disabled={isLoading}
                                        >
                                            预加载
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 下载进度 */}
                {downloadProgress.size > 0 && (
                    <div className={styles.statusSection}>
                        <h4>📥 下载进度</h4>
                        <div className={styles.downloadProgress}>
                            {Array.from(downloadProgress.entries()).map(([url, progress]) => (
                                <div key={url} className={styles.progressItem}>
                                    <div className={styles.progressLabel}>
                                        {url.split('/').pop()?.slice(0, 30)}...
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <span className={styles.progressText}>{progress}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 操作按钮 */}
                <div className={styles.statusSection}>
                    <h4>🛠️ 操作</h4>
                    <div className={styles.actionButtons}>
                        <button
                            onClick={clearCache}
                            className={`${styles.actionBtn} ${styles.clearBtn}`}
                            disabled={isLoading}
                        >
                            {isLoading ? '清理中...' : '清理缓存'}
                        </button>
                        <button
                            onClick={exportCache}
                            className={`${styles.actionBtn} ${styles.exportBtn}`}
                            disabled={isLoading}
                        >
                            {isLoading ? '导出中...' : '导出数据'}
                        </button>
                        <button
                            onClick={updateCacheStats}
                            className={`${styles.actionBtn} ${styles.refreshBtn}`}
                            disabled={isLoading}
                        >
                            {isLoading ? '刷新中...' : '刷新状态'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}