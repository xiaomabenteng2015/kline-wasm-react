'use client';
import React from 'react';
import styles from '../../../styles/ResultDisplay.module.css';
import { BinanceKline } from '../../../services/binanceService';

interface ResultDisplayProps {
    klineData: BinanceKline[];
    result: number | null;
    signal: string | null;
    prob: number | null;
}

/**
 * 分析结果显示组件
 */
export default function ResultDisplay({ klineData, result, signal, prob }: ResultDisplayProps) {
    return (
        <>
            <div className={styles.resultSection}>
                <div className={styles.resultTitle}>最后一条K线数据：</div>
                <pre className={styles.resultContent}>
                    {klineData.length > 0 ? JSON.stringify(klineData[klineData.length - 1], null, 2) : '暂无'}
                </pre>
            </div>
            <div className={styles.resultSection}>
                <div className={styles.resultTitle}>模型输出（涨的概率）：</div>
                <pre className={styles.resultContent}>
                    {result !== null ? result : '暂无'}
                </pre>
            </div>
            <div className={styles.resultSection}>
                <div className={styles.resultTitle}>推理信号：</div>
                <pre className={styles.resultContent}>
                    {signal ? `${signal} (置信度: ${prob})` : '暂无'}
                </pre>
            </div>
        </>
    );
}