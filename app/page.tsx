'use client';
import React, { useState } from 'react';
import KlineChart from './components/KlineChart';
import ResultDisplay from './components/ResultDisplay';
import { analyzeKlineData, initInferenceService, cleanupInferenceService } from './services/inferenceService';
import styles from './styles/HomePage.module.css';
import { useKlineData } from './hooks/useKlineData';
import { KlineInterval } from './services/binanceService';

// 常用交易对列表
const TRADING_PAIRS = [
  { symbol: 'BTCUSDT', name: 'BTC/USDT' },
  { symbol: 'ETHUSDT', name: 'ETH/USDT' },
  { symbol: 'BNBUSDT', name: 'BNB/USDT' },
  { symbol: 'SOLUSDT', name: 'SOL/USDT' },
  { symbol: 'DOGEUSDT', name: 'DOGE/USDT' },
  { symbol: 'ADAUSDT', name: 'ADA/USDT' },
];

export default function HomePage() {
  const [result, setResult] = useState<number | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [prob, setProb] = useState<number | null>(null);
  const [inferenceLoading, setInferenceLoading] = useState(false);
  const [useRealData, setUseRealData] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [selectedInterval, setSelectedInterval] = useState<KlineInterval>(KlineInterval.ONE_DAY);
  const [autoAnalyze, setAutoAnalyze] = useState(true); // 是否自动分析
  const lastKlineTimeRef = React.useRef<number | null>(null); // 用于跟踪最后一根K线的时间

  // 使用自定义Hook获取K线数据
  const { klineData, loading: klineLoading, error } = useKlineData({
    symbol: selectedSymbol,
    interval: selectedInterval,
    limit: 1000,
    useRealData
  });

  // 推理函数已移至上方的useCallback中

  // 初始化推理服务
  const [inferenceServiceReady, setInferenceServiceReady] = React.useState(false);
  const [inferenceServiceError, setInferenceServiceError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const initService = async () => {
      try {
        console.log('开始初始化推理服务...');
        await initInferenceService();
        if (mounted) {
          console.log('推理服务初始化成功');
          setInferenceServiceReady(true);
          setInferenceServiceError(null);
        }
      } catch (error) {
        console.error('推理服务初始化失败:', error);
        if (mounted) {
          setInferenceServiceError(error instanceof Error ? error.message : '推理服务初始化失败');
        }
      }
    };

    initService();

    return () => {
      mounted = false;
      console.log('清理推理服务...');
      cleanupInferenceService();
    };
  }, []);

  // 使用useCallback包装handleAnalyze函数，避免每次渲染都创建新函数
  const memoizedHandleAnalyze = React.useCallback(async () => {
    if (!klineData.length) return;

    setInferenceLoading(true);
    setResult(null);
    setSignal(null);
    setProb(null);

    try {
      console.log('开始分析K线数据...');
      const { result: inferenceResult, signal: inferenceSignal, prob: inferenceProb } =
        await analyzeKlineData(klineData);

      console.log(`分析结果: ${inferenceSignal}, 概率: ${inferenceProb}`);
      setResult(inferenceResult);
      setSignal(inferenceSignal);
      setProb(inferenceProb);
    } catch (error) {
      console.error('分析错误:', error);
      // 不弹出错误提示，避免影响用户体验
    } finally {
      setInferenceLoading(false);
    }
  }, [klineData]);

  // 监听K线数据变化，当有新数据时自动分析
  React.useEffect(() => {
    if (!klineData.length || !autoAnalyze) return;

    const lastKline = klineData[klineData.length - 1];

    // 如果是首次加载数据或者收到了新的K线，执行分析
    if (lastKlineTimeRef.current === null || lastKlineTimeRef.current !== lastKline.time) {
      console.log(`检测到新K线数据，时间: ${new Date(lastKline.time * 1000).toLocaleString()}`);
      lastKlineTimeRef.current = lastKline.time;
      memoizedHandleAnalyze();
    }
  }, [klineData, autoAnalyze, memoizedHandleAnalyze]);

  // 切换数据源
  const toggleDataSource = () => {
    setUseRealData(!useRealData);
  };

  // 切换K线间隔
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInterval(e.target.value as KlineInterval);
  };

  // 切换交易对
  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSymbol(e.target.value);
    // 切换交易对时重置最后K线时间引用，确保新交易对的第一根K线会被分析
    lastKlineTimeRef.current = null;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{selectedSymbol} K线数据分析 Demo</h2>

      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          <div className={styles.symbolSelector}>
            <label>交易对: </label>
            <select value={selectedSymbol} onChange={handleSymbolChange}>
              {TRADING_PAIRS.map(pair => (
                <option key={pair.symbol} value={pair.symbol}>
                  {pair.name}
                </option>
              ))}
            </select>
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

          <div className={styles.autoAnalyzeToggle}>
            <label>
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={() => setAutoAnalyze(!autoAnalyze)}
              />
              自动分析新K线
            </label>
          </div>
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
          <KlineChart data={klineData} signal={signal} prob={prob} />
          <button
            onClick={memoizedHandleAnalyze}
            disabled={inferenceLoading || klineData.length === 0}
            className={styles.analyzeButton}
          >
            {inferenceLoading ? '分析中...' : '手动分析K线数据'}
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