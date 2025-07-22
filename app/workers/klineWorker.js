/**
 * K线数据处理 Web Worker
 */
self.onmessage = async (e) => {
  const klineData = e.data; // 全部历史K线
  await new Promise((res) => setTimeout(res, 500));
  // 只对最后一根K线推理，信号和概率用 mock 生成
  const lastIdx = klineData.length - 1;
  const result = {
    index: lastIdx,
    signal: Math.random() > 0.5 ? "buy" : "sell",
    prob: Math.random().toFixed(2),
  };
  self.postMessage(result);
};
