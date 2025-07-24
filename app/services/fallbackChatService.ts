/**
 * 备用聊天服务 - 当WebLLM不可用时使用的简单聊天机器人
 */
import { Message } from "../views/ai/components/ChatInterface";

// 预定义的回复模板
const RESPONSES = {
  greeting: [
    "你好！我是K线预测系统的AI助手。我可以帮你了解K线图、加密货币和模型训练相关的问题。",
    "欢迎使用K线预测系统！有什么我可以帮助你的吗？",
    "你好！我是你的AI助手，专门帮助解答关于K线分析和加密货币的问题。",
  ],

  kline: [
    "K线图是显示价格变化的图表，每根K线包含开盘价、收盘价、最高价和最低价四个信息。绿色K线表示价格下跌，红色K线表示价格上涨。",
    "K线图可以帮助分析价格趋势。长期趋势看日K线，短期波动看小时或分钟K线。结合成交量分析效果更好。",
    "K线形态有很多种，比如十字星、锤头线、吞没形态等，每种形态都有特定的市场含义。",
  ],

  training: [
    "模型训练需要大量历史数据。建议使用至少1000条K线数据，训练轮数50-100次比较合适。",
    "训练参数的选择很重要：批次大小32-64，学习率0.001，可以根据训练效果调整。",
    "模型准确率60%以上就算不错了，金融市场预测本身就很困难，不要期望过高的准确率。",
  ],

  crypto: [
    "加密货币市场24小时交易，波动性很大。投资前一定要做好风险管理。",
    "BTC是加密货币的龙头，ETH有智能合约功能，其他币种各有特色。选择时要看项目基本面。",
    "技术分析只是工具之一，还要结合基本面分析和市场情绪。",
  ],

  system: [
    "这个系统包含三个主要功能：首页的K线分析、模型训练页面和模型管理页面。",
    "你可以在首页查看实时K线数据，在训练页面创建预测模型，在模型管理页面上传和管理模型。",
    "系统支持多种交易对和时间周期，可以根据需要选择合适的参数。",
  ],

  default: [
    "这是一个很好的问题。关于K线分析和加密货币，有很多值得探讨的内容。",
    "我建议你可以先从基础的K线知识开始学习，然后逐步了解技术指标和交易策略。",
    "如果你有具体的问题，可以更详细地描述，我会尽力帮助你。",
    "投资有风险，建议你在实际操作前多学习相关知识，做好风险控制。",
  ],
};

// 关键词匹配规则
const KEYWORD_RULES = [
  { keywords: ["你好", "您好", "hello", "hi", "开始"], category: "greeting" },
  { keywords: ["k线", "K线", "蜡烛图", "图表", "价格"], category: "kline" },
  {
    keywords: ["训练", "模型", "机器学习", "准确率", "参数"],
    category: "training",
  },
  {
    keywords: ["比特币", "btc", "eth", "加密货币", "数字货币", "币"],
    category: "crypto",
  },
  { keywords: ["系统", "功能", "怎么用", "如何", "页面"], category: "system" },
];

// 生成回复
export async function generateFallbackResponse(
  prompt: string,
  history: Message[],
  onChunk: (chunk: string) => void
): Promise<void> {
  // 模拟思考时间
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 分析用户输入，匹配关键词
  const lowerPrompt = prompt.toLowerCase();
  let category = "default";

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => lowerPrompt.includes(keyword))) {
      category = rule.category;
      break;
    }
  }

  // 选择回复
  const responses = RESPONSES[category as keyof typeof RESPONSES];
  const response = responses[Math.floor(Math.random() * responses.length)];

  // 添加免责声明（如果是投资相关问题）
  let fullResponse = response;
  if (category === "crypto" || category === "training") {
    fullResponse +=
      "\n\n注意：以上内容仅供参考，不构成投资建议。投资有风险，请谨慎决策。";
  }

  // 模拟流式输出
  const words = fullResponse.split("");
  for (let i = 0; i < words.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 20)); // 每个字符20ms延迟
    onChunk(words[i]);
  }
}

// 检查是否应该使用备用服务
export function shouldUseFallback(): boolean {
  // 强制不使用备用服务，确保总是尝试使用 WebLLM
  console.log("强制使用 WebLLM，不切换到备用服务");

  // 只在非浏览器环境下使用备用服务（服务器端渲染时）
  if (typeof window === "undefined") {
    return true;
  }

  // 其他所有情况都尝试使用 WebLLM
  return false;
}
