'use client';
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import styles from '../styles/KlineChart.module.css';
import { KlineData } from '../types';

interface KlineChartProps {
    data: KlineData[];
}

/**
 * K线图表组件
 */
export default function KlineChart({ data }: KlineChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        // 清空容器
        chartContainerRef.current.innerHTML = '';

        try {
            const chart = createChart(chartContainerRef.current, {
                width: 800,
                height: 400,
                layout: {
                    background: { type: ColorType.Solid, color: '#ffffff' },
                    textColor: '#333333',
                },
                grid: {
                    vertLines: { color: '#f0f0f0' },
                    horzLines: { color: '#f0f0f0' },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            // 创建蜡烛图系列
            const candleSeries = chart.addCandlestickSeries({
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });

            // 准备数据 - 确保时间格式正确
            const chartData = data.map(({ time, open, high, low, close }) => ({
                time: time as any, // 类型转换以匹配库的要求
                open: Number(open),
                high: Number(high),
                low: Number(low),
                close: Number(close)
            }));

            // 设置数据
            candleSeries.setData(chartData);

            // 自适应视图
            chart.timeScale().fitContent();

            return () => {
                chart.remove();
            };
        } catch (error) {
            console.error('Chart creation error:', error);
        }
    }, [data]);

    return (
        <div className={styles.chartContainer}>
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}