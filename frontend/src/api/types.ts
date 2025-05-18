import { ethers } from 'ethers';

// 单个加密货币资产
export interface CryptoAsset {
  symbol: string;     // 加密货币符号：BTC, ETH, USDC等
  percentage: number; // 持有百分比 (0-100)
  chain?: string;     // 资产所在的区块链网络
  amount?: number;    // 用户持有的实际数量
  price?: number;     // 当前资产单价(USD)
}

// AI投顾请求参数接口
export interface AdvisorRequestInput {
  riskLevel: 'low' | 'medium' | 'high'; // 风险承受能力
  amount: number;                      // 资产总价值(USD)，原来的参数名保持不变，但含义已更改
  cryptoAssets: CryptoAsset[];         // 当前持有的加密货币资产详情
  userMessage?: string;                // 用户的其他需求描述或投资偏好
}

// AI建议项
export interface AllocationItem {
  asset: string;      // 资产名称
  percentage: number; // 配置百分比
  chain?: string;     // 推荐的区块链网络
}

// API请求体
export interface AdviceRequestBody {
  userAddress: string;
  input: AdvisorRequestInput;
  requestHash: string;
}

// AI响应结果接口
export interface AdvisorResponse {
  success: boolean;
  action?: 'recommend' | 'trade'; // 操作类型
  data?: {
    recommendation: string;    // 简短建议文本或交易摘要
    allocation: AllocationItem[]; // 具体资产配置
    cid: string;               // IPFS内容ID
    txHash: string;            // 区块链交易哈希
    signature: string;         // 后端签名
    timestamp: number;         // 签名时间戳
    // 交易相关字段(仅当action='trade'时有效)
    trades?: TradeItem[];      // 交易详情列表
    tradeSummary?: string;     // 交易方案总结
  };
  error?: string;
  message?: string;
}

// 区块链事件
export interface BlockchainEvent {
  event: string;
  address: string;
  returnValues: Record<string, any>;
  blockNumber: number;
}

// 交易验证结果
export interface TransactionVerification {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  status: string;
  gasUsed: number;
  events: BlockchainEvent[];
}

// 交易验证响应
export interface VerifyResponse {
  success: boolean;
  data?: TransactionVerification;
  error?: string;
}

// 交易项
export interface TradeItem {
  fromAsset: string;      // 源资产名称
  fromChain?: string;     // 源资产所在链
  toAsset: string;        // 目标资产名称
  toChain?: string;       // 目标资产所在链
  amount: number;         // 交易数量
  amountInUSD?: number;   // 美元价值
  reason?: string;        // 交易原因
}

// IPFS存储的完整数据格式
export interface IPFSStorageData {
  input: AdvisorRequestInput;
  output: {
    modelVersion: string;
    timestamp: number;
    action: 'recommend' | 'trade';
    allocation?: AllocationItem[];
    allocationText?: string;
    trades?: TradeItem[];
    tradeSummary?: string;
  };
  timestamp: number;
}

// 区块链上的用户请求记录
export interface BlockchainRequest {
  requestHash: string;
  cid: string;
  timestamp: number;
  // 可选的IPFS数据缓存
  details?: {
    recommendation?: string;
    allocation?: AllocationItem[];
    trades?: TradeItem[];       // 交易详情(当action为trade时)
  };
}

// 错误处理
export class APIError extends Error {
  statusCode: number;
  errorCode?: string;
  
  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// 工具函数：生成请求哈希
export function generateRequestHash(input: AdvisorRequestInput): string {
  try {
    // 对数组内的对象进行排序以确保一致性
    const sortedAssets = [...input.cryptoAssets].sort((a, b) => 
      a.symbol.localeCompare(b.symbol) || a.percentage - b.percentage
    );
    
    // 创建副本并使用排序后的资产
    const sortedInput = {
      ...input,
      cryptoAssets: sortedAssets
    };
    
    // 序列化为JSON，使用特定格式 (与后端相匹配)
    const jsonStr = JSON.stringify(sortedInput, (_key, value) => {
      // 使值格式化方式与后端一致
      if (typeof value === 'number') {
        // 确保数字格式一致
        return Number(value);
      }
      return value;
    });
    
    // 去除所有空格和换行符，确保格式一致性
    const compactJson = jsonStr.replace(/\s/g, '');
    console.log("前端计算哈希的输入:", compactJson);
    
    // 使用keccak256哈希
    const hash = ethers.keccak256(ethers.toUtf8Bytes(compactJson));
    console.log("前端计算的哈希:", hash);
    
    return hash;
  } catch (error) {
    console.error('计算请求哈希时出错:', error);
    // 发生错误时返回一个空哈希
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
}

// 工具函数：验证签名
export function verifySignature(message: string, signature: string, timestamp: number, expectedAddress: string): boolean {
  try {
    // 创建包含时间戳的消息
    const messageWithTimestamp = `${message}:${timestamp}`;
    const recoveredAddress = ethers.verifyMessage(messageWithTimestamp, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('签名验证失败:', error);
    return false;
  }
}

// 市场恐慌与贪婪指数数据接口
export interface FearGreedIndex {
  value: number;                 // 恐慌贪婪指数值(0-100)
  value_classification: string;  // 指数分类文字描述
  timestamp: string;             // 时间戳
}

// 市场趋势数据接口
export interface MarketTrend {
  trend: string;                // 市场趋势: "看涨", "看跌", "盘整"
  description: string;          // 趋势描述
  fear_greed_value: number;     // 关联的恐慌贪婪指数值
  timestamp: string;            // 时间戳
}

// 以太坊GAS费数据接口
export interface EthGasPrice {
  low: number;       // 低速确认价格(Gwei)
  average: number;   // 中速确认价格(Gwei)
  high: number;      // 快速确认价格(Gwei)
  timestamp: string; // 时间戳
}

// 市场数据响应接口
export interface MarketDataResponse {
  success: boolean;
  data?: {
    fear_greed_index: FearGreedIndex;
    market_trend: MarketTrend;
    gas_price: EthGasPrice;
  };
  message?: string;
  error?: string;
} 