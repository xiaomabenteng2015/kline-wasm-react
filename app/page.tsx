'use client';
import React, { useEffect, useState } from 'react';
import KlineChart from './components/KlineChart';
import ResultDisplay from './components/ResultDisplay';
import { generateKlineData } from './lib/klineUtils';
import { analyzeKlineData } from './models/inference';
import styles from './styles/HomePage.module.css';
import { KlineData } from './types';

export default function HomePage() {
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [prob, setProb] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setKlineData(generateKlineData(1000));
  }, []);

  // 推理函数
  const handleAnalyze = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>K线数据分析推理 Demo (TensorFlow.js + WASM)</h2>
      <KlineChart data={klineData} />
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className={styles.analyzeButton}
      >
        {loading ? '分析中...' : '分析K线数据'}
      </button>

      <ResultDisplay
        klineData={klineData}
        result={result}
        signal={signal}
        prob={prob}
      />
    </div>
  );
}