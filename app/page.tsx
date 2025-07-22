'use client';
import React, { useState } from 'react';
import KlineChart from './components/KlineChart';
import ResultDisplay from './components/ResultDisplay';
import { analyzeKlineData } from './models/inference';
import styles from './styles/HomePage.module.css';
import { useKlineData } from './hooks/useKlineData';
import { KlineInterval } from './services/binanceService';

export default function HomePage() {
  const [result, setResult] = useState<number | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [prob, setProb] = useState<number | null>(null);
  const [inferenceLoading, setInferenceLoading] = useState(false);
  const [useRealData, setUseRealData] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<KlineInterval>(KlineInterval.ONE_DAY);

  // 使用自定义Hook获取K线数据
  const { klineData, loading: klineLoading, error } = useKlineData({
    symbol: 'BTCUSDT',
    interval: selectedInterval,
    limit: 1000,
    useRealData
  });

  // 推理函数
  const handleAnalyze = async () => {
    setInferenceLoading(true);
    setResult(null);
    setSignal(null);
    setProb(null);

    try {
      const { result: inferenceResult, signal: inferenceSignal, prob: inferenceProb } =
        await analyzeKlineData(klineData);

      setResult(inferenceResult);
      setSignal(inferenceSignal);
      setProb(inferenceProb);
    } catch (error) {
      console.error('分析错误:', error);
      alert(error instanceof Error ? error.message : '分析过程中发生错误');
    } finally {
      setInferenceLoading(false);
    }
  };

  // 切换数据源
  const toggleDataSource = () => {
    setUseRealData(!useRealData);
  };

  // 切换K线间隔
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInterval(e.target.value as KlineInterval);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>BTC/USDT K线数据分析 Demo</h2>

      <div className={styles.controls}>
        <div className={styles.dataSourceToggle}>
          <label>
            <input
              type="checkbox"
              checked={useRealData}
              onChange={toggleDataSource}
            />
            使用真实币安数据
          </label>
        </div>

        <div className={styles.intervalSelector}>
          <label>K线间隔: </label>
          <select value={selectedInterval} onChange={handleIntervalChange}>
            <option value={KlineInterval.ONE_MINUTE}>1分钟</option>
            <option value={KlineInterval.FIVE_MINUTES}>5分钟</option>
            <option value={KlineInterval.FIFTEEN_MINUTES}>15分钟</option>
            <option value={KlineInterval.ONE_HOUR}>1小时</option>
            <option value={KlineInterval.FOUR_HOUR}>4小时</option>
            <option value={KlineInterval.ONE_DAY}>1天</option>
            <option value={KlineInterval.ONE_WEEK}>1周</option>
          </select>
        </div>
      </div>

      {klineLoading ? (
        <div className={styles.loading}>加载K线数据中...</div>
      ) : error ? (
        <div className={styles.error}>
          加载数据出错: {error.message}
        </div>
      ) : (
        <>
          <KlineChart data={klineData} />
          <button
            onClick={handleAnalyze}
            disabled={inferenceLoading || klineData.length === 0}
            className={styles.analyzeButton}
          >
            {inferenceLoading ? '分析中...' : '分析K线数据'}
          </button>

          <ResultDisplay
            klineData={klineData}
            result={result}
            signal={signal}
            prob={prob}
          />
        </>
      )}
    </div>
  );
}