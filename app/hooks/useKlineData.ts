import { useState, useEffect, useRef } from "react";
import {
  fetchHistoricalKlines,
  createKlineWebSocket,
  BinanceKline,
  KlineInterval,
} from "../services/binanceService";

interface UseKlineDataProps {
  symbol?: string;
  interval?: KlineInterval;
  limit?: number;
  useRealData?: boolean; // 是否使用真实数据，否则使用模拟数据
}

/**
 * 自定义Hook，用于获取和管理K线数据
 */
export function useKlineData({
  symbol = "BTCUSDT",
  interval = KlineInterval.ONE_DAY,
  limit = 500,
  useRealData = true,
}: UseKlineDataProps = {}) {
  const [klineData, setKlineData] = useState<BinanceKline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<{ ws: WebSocket; close: () => void } | null>(null);
  const initialDataLoadedRef = useRef<boolean>(false);

  // 生成模拟K线数据的函数
  const generateMockKlineData = (count = 500) => {
    const arr: BinanceKline[] = [];
    let price = 100;
    const startTime = Math.floor(Date.now() / 1000) - count * 24 * 60 * 60;

    for (let i = 0; i < count; i++) {
      const open = price;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random();
      const low = Math.min(open, close) - Math.random();
      const volume = Math.random() * 1000;
      const time = startTime + i * 24 * 60 * 60;
      arr.push({ time, open, high, low, close, volume });
      price = close;
    }
    return arr;
  };

  // 获取历史K线数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`开始获取${useRealData ? "真实" : "模拟"}K线数据`);

        let data: BinanceKline[];

        if (useRealData) {
          // 获取真实数据
          data = await fetchHistoricalKlines(symbol, interval, limit);
        } else {
          // 使用模拟数据
          data = generateMockKlineData(limit);
        }

        console.log(`获取到${data.length}条K线数据`);
        setKlineData(data);
        initialDataLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to fetch kline data:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        // 如果真实数据获取失败，回退到模拟数据
        if (useRealData) {
          console.log("使用模拟数据作为回退");
          const mockData = generateMockKlineData(limit);
          setKlineData(mockData);
          initialDataLoadedRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 组件卸载时重置初始数据加载标志
    return () => {
      initialDataLoadedRef.current = false;
    };
  }, [symbol, interval, limit, useRealData]);

  // 设置WebSocket连接获取实时数据
  useEffect(() => {
    // 清理之前的WebSocket连接
    if (wsRef.current) {
      console.log("关闭之前的WebSocket连接");
      wsRef.current.close();
      wsRef.current = null;
    }

    // 只有在使用真实数据且初始数据已加载时才创建WebSocket连接
    if (!useRealData || !initialDataLoadedRef.current) {
      console.log(
        `不创建WebSocket连接: useRealData=${useRealData}, initialDataLoaded=${initialDataLoadedRef.current}`
      );
      return;
    }

    console.log("创建新的WebSocket连接");

    // 处理接收到的WebSocket消息
    const handleWsMessage = (newData: BinanceKline) => {
      console.log(
        `收到WebSocket K线更新: ${new Date(
          newData.time * 1000
        ).toLocaleString()}`
      );

      setKlineData((prevData) => {
        // 检查是否是更新现有K线还是添加新K线
        const lastKline = prevData[prevData.length - 1];

        if (lastKline && lastKline.time === newData.time) {
          // 更新现有K线
          console.log("更新现有K线");
          return prevData.map((item, index) =>
            index === prevData.length - 1 ? newData : item
          );
        } else {
          // 添加新K线
          console.log("添加新K线");
          return [...prevData, newData];
        }
      });
    };

    // 创建WebSocket连接
    const wsConnection = createKlineWebSocket(
      symbol,
      interval,
      handleWsMessage
    );
    wsRef.current = wsConnection;

    // 清理函数
    return () => {
      if (wsRef.current) {
        console.log("组件卸载，关闭WebSocket连接");
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, interval, useRealData, initialDataLoadedRef.current]);

  return { klineData, loading, error };
}
