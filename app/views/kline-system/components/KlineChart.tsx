'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LogicalRange } from 'lightweight-charts';
import styles from '../../../styles/KlineChart.module.css';
import { BinanceKline } from '../../../services/binanceService';

interface KlineChartProps {
    data: BinanceKline[];
    signal?: string | null;
    prob?: number | null;
}

/**
 * K线图表组件
 */
export default function KlineChart({ data, signal, prob }: KlineChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const [visibleRange, setVisibleRange] = useState<LogicalRange | null>(null);
    const [autoScroll, setAutoScroll] = useState<boolean>(false);
    const isInitialRender = useRef<boolean>(true);

    // 创建图表
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // 清空容器
        chartContainerRef.current.innerHTML = '';

        try {
            // 创建图表
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

            // 保存图表引用
            chartRef.current = chart;

            // 创建蜡烛图系列
            const candleSeries = chart.addCandlestickSeries({
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });

            // 保存系列引用
            seriesRef.current = candleSeries;

            // 监听视图范围变化
            chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (range) {
                    setVisibleRange(range);
                }
            });

            return () => {
                chart.remove();
                chartRef.current = null;
                seriesRef.current = null;
            };
        } catch (error) {
            console.error('Chart creation error:', error);
        }
    }, []); // 只在组件挂载时创建图表

    // 更新数据
    useEffect(() => {
        if (!chartRef.current || !seriesRef.current || data.length === 0) return;

        try {
            // 准备数据 - 确保时间格式正确
            const chartData = data.map(({ time, open, high, low, close }) => ({
                time: time as any, // 类型转换以匹配库的要求
                open: Number(open),
                high: Number(high),
                low: Number(low),
                close: Number(close)
            }));

            // 设置数据
            seriesRef.current.setData(chartData);

            // 如果是初始渲染或者启用了自动滚动，则自适应视图
            if (isInitialRender.current || autoScroll) {
                chartRef.current.timeScale().fitContent();
                isInitialRender.current = false;
            } else if (visibleRange) {
                // 否则，尝试恢复之前的视图范围
                chartRef.current.timeScale().setVisibleLogicalRange(visibleRange);
            }
        } catch (error) {
            console.error('Chart update error:', error);
        }
    }, [data, autoScroll, visibleRange]);

    // 更新买卖信号标记
    useEffect(() => {
        if (!seriesRef.current || !signal || !prob || data.length === 0) return;

        try {
            const lastKline = data[data.length - 1];
            const markers = [];

            if (signal === 'buy') {
                markers.push({
                    time: lastKline.time as any,
                    position: 'belowBar',
                    color: '#26a69a',
                    shape: 'arrowUp',
                    text: `买入 (${prob})`
                });
            } else if (signal === 'sell') {
                markers.push({
                    time: lastKline.time as any,
                    position: 'aboveBar',
                    color: '#ef5350',
                    shape: 'arrowDown',
                    text: `卖出 (${prob})`
                });
            }

            seriesRef.current.setMarkers(markers);
        } catch (error) {
            console.error('设置标记错误:', error);
        }
    }, [signal, prob, data]);

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartControls}>
                <label className={styles.autoScrollToggle}>
                    <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={() => setAutoScroll(!autoScroll)}
                    />
                    自动滚动到最新K线
                </label>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}