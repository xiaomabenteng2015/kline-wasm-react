/**
 * 币安API服务
 * 提供HTTP和WebSocket方式获取BTC/USDT K线数据
 */
import { WebSocketManager } from "./websocketManager";

// K线数据类型定义
export interface BinanceKline {
  time: number; // 开盘时间（Unix时间戳，秒）
  open: number; // 开盘价
  high: number; // 最高价
  low: number; // 最低价
  close: number; // 收盘价
  volume: number; // 交易量
}

// K线间隔枚举
export enum KlineInterval {
  ONE_MINUTE = "1m",
  THREE_MINUTES = "3m",
  FIVE_MINUTES = "5m",
  FIFTEEN_MINUTES = "15m",
  THIRTY_MINUTES = "30m",
  ONE_HOUR = "1h",
  TWO_HOUR = "2h",
  FOUR_HOUR = "4h",
  SIX_HOUR = "6h",
  EIGHT_HOUR = "8h",
  TWELVE_HOUR = "12h",
  ONE_DAY = "1d",
  THREE_DAY = "3d",
  ONE_WEEK = "1w",
  ONE_MONTH = "1M",
}

/**
 * 带重试机制的fetch函数
 */
async function fetchWithRetry(
  url: string,
  options = {},
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    console.log(`正在请求: ${url}`);
    const response = await fetch(url, options);
    if (response.ok) return response;

    if (retries > 0) {
      console.log(`请求失败，${delay}ms后重试，剩余重试次数: ${retries - 1}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }

    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  } catch (error) {
    if (retries > 0) {
      console.log(`请求出错，${delay}ms后重试，剩余重试次数: ${retries - 1}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * 通过HTTP获取历史K线数据
 * @param symbol 交易对，默认BTC/USDT
 * @param interval K线间隔，默认1天
 * @param limit 获取数量，默认500条
 * @returns 处理后的K线数据数组
 */
export async function fetchHistoricalKlines(
  symbol: string = "BTCUSDT",
  interval: KlineInterval = KlineInterval.ONE_DAY,
  limit: number = 500
): Promise<BinanceKline[]> {
  try {
    // 直接使用币安API，不使用代理
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    console.log(`获取K线数据: ${url}`);

    // 使用带重试机制的fetch
    const response = await fetchWithRetry(url);
    const data = await response.json();

    console.log(`获取到${data.length}条K线数据`);

    // 转换币安返回的数据格式为我们应用中使用的格式
    return data.map((item: any[]) => ({
      time: Math.floor(item[0] / 1000), // 币安返回的是毫秒，转换为秒
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
    }));
  } catch (error) {
    console.error("获取历史K线数据失败:", error);
    throw error;
  }
}

/**
 * 创建K线WebSocket连接
 * @param symbol 交易对，默认BTC/USDT
 * @param interval K线间隔，默认1天
 * @param onMessage 接收到新K线数据的回调函数
 * @returns 包含订阅和取消订阅方法的对象
 */
export function createKlineWebSocket(
  symbol: string = "BTCUSDT",
  interval: KlineInterval = KlineInterval.ONE_DAY,
  onMessage: (kline: BinanceKline) => void
) {
  // 构建WebSocket URL
  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;

  console.log(`创建K线WebSocket连接: ${wsUrl}`);

  // 获取或创建WebSocket管理器实例
  const wsManager = WebSocketManager.getInstance(wsUrl);

  // 处理K线消息的函数
  const handleKlineMessage = (data: any) => {
    try {
      const k = data.k;
      const kline: BinanceKline = {
        time: Math.floor(k.t / 1000), // 毫秒转秒
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };

      console.log(
        `收到K线更新: ${new Date(kline.time * 1000).toLocaleString()}`
      );
      onMessage(kline);
    } catch (error) {
      console.error("处理K线数据失败:", error);
    }
  };

  // 添加消息处理器
  wsManager.addMessageHandler("kline", handleKlineMessage);

  // 返回控制对象
  return {
    // 为了保持与之前接口兼容，保留ws属性
    ws: {} as WebSocket,
    // 关闭连接方法
    close: () => {
      wsManager.removeMessageHandler("kline", handleKlineMessage);
    },
  };
}
