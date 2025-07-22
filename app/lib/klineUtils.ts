/**
 * K线数据生成和处理工具
 */

/**
 * 生成模拟K线数据
 * @param count 生成的K线数量
 * @returns K线数据数组
 */
export function generateKlineData(count = 1000) {
  const arr = [];
  let price = 100;
  // 从30天前开始生成数据
  const startTime = Math.floor(Date.now() / 1000) - (count * 24 * 60 * 60);

  for (let i = 0; i < count; i++) {
    const open = price;
    const close = open + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();
    const volume = Math.random() * 1000;
    // lightweight-charts 需要 Unix 时间戳（秒）
    const time = startTime + (i * 24 * 60 * 60);
    arr.push({ time, open, high, low, close, volume });
    price = close;
  }
  return arr;
}