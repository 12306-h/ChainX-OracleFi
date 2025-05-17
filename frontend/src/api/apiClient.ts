import {
  AdvisorRequestInput,
  AdvisorResponse,
  VerifyResponse,
  IPFSStorageData,
  APIError,
  generateRequestHash,
  BlockchainRequest,
  MarketDataResponse,
  FearGreedIndex
} from './types';

// API 基础URL - 根据环境配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// IPFS配置
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

/**
 * AI服务API客户端实现
 */
export class ApiClient {
  /**
   * 获取AI投资建议
   * @param userAddress 用户地址
   * @param input 投资请求参数
   * @returns 投资建议或交易执行响应
   */
  async getAdvice(userAddress: string, input: AdvisorRequestInput): Promise<AdvisorResponse> {
    try {
      const requestHash = generateRequestHash(input);
      
      const response = await fetch(`${API_BASE_URL}/api/advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userAddress,
          input,
          requestHash
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.detail || '未知错误',
          response.status,
          errorData.error
        );
      }
      
      const result = await response.json();
      
      // 处理不同的响应类型
      const action = result.action || 'recommend';
      const data = result.data || {};
      
      // 根据操作类型将响应映射回前端所需的结构
      if (action === 'recommend') {
        return {
          success: result.success,
          data: {
            recommendation: data.recommendation || '',
            allocation: data.allocation || [],
            cid: data.cid,
            txHash: data.txHash,
            signature: data.signature,
            timestamp: data.timestamp
          }
        };
      } else if (action === 'trade') {
        return {
          success: result.success,
          action: 'trade',
          data: {
            recommendation: data.tradeSummary || '', // 使用tradeSummary作为recommendation显示
            allocation: [], // 保持空数组，可能在后续处理中转换
            trades: data.trades || [],
            tradeSummary: data.tradeSummary || '',
            cid: data.cid,
            txHash: data.txHash,
            signature: data.signature,
            timestamp: data.timestamp
          }
        };
      }
      
      return result;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error('获取AI建议失败:', error);
      return {
        success: false,
        error: 'API_ERROR',
        message: '调用AI顾问服务失败'
      };
    }
  }
  
  /**
   * 从IPFS获取完整数据
   * @param cid IPFS内容ID
   * @returns IPFS存储数据
   */
  async getIpfsData(cid: string): Promise<IPFSStorageData | null> {
    try {
      // 先尝试直接从IPFS网关获取
      try {
        console.log('尝试直接从IPFS网关获取数据:', `${IPFS_GATEWAY}/${cid}`);
        const ipfsResponse = await fetch(`${IPFS_GATEWAY}/${cid}`);
        
        if (ipfsResponse.ok) {
          const data = await ipfsResponse.json();
          console.log('从IPFS网关获取数据成功');
          return data;
        } else {
          console.log(`从IPFS网关获取失败，状态码: ${ipfsResponse.status}`);
        }
      } catch (ipfsError) {
        console.error('直接从IPFS网关获取数据失败:', ipfsError);
      }
      
      // 如果从IPFS网关获取失败，再尝试使用后端API获取
      console.log('从后端API获取IPFS数据:', `${API_BASE_URL}/api/ipfs/${cid}`);
      const response = await fetch(`${API_BASE_URL}/api/ipfs/${cid}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('从后端API获取IPFS数据成功');
        return result.data;
      }
      
      throw new Error(`无法获取IPFS数据，CID: ${cid}`);
    } catch (error) {
      console.error('IPFS数据获取失败:', error);
      return null;
    }
  }
  
  /**
   * 验证区块链交易
   * @param txHash 交易哈希
   * @returns 验证结果
   */
  async verifyTransaction(txHash: string): Promise<VerifyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify/${txHash}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.detail || '交易验证失败',
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('验证交易失败:', error);
      return {
        success: false,
        error: error instanceof APIError ? error.message : '验证交易时发生错误'
      };
    }
  }

  /**
   * 获取用户的历史投资建议记录
   * @param userAddress 用户钱包地址
   * @returns 历史记录列表
   */
  async getUserRequests(userAddress: string): Promise<BlockchainRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${userAddress}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.detail || '获取历史记录失败',
          response.status
        );
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('获取用户历史记录失败:', error);
      return [];
    }
  }

  /**
   * 获取市场数据
   * @returns 市场数据响应
   */
  async getMarketData(): Promise<MarketDataResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market/data`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.detail || '获取市场数据失败',
          response.status,
          errorData.error
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取市场数据失败:', error);
      return {
        success: false,
        error: error instanceof APIError ? error.message : '获取市场数据时发生错误',
        message: '无法获取市场数据'
      };
    }
  }
  
  /**
   * 获取恐慌与贪婪指数
   * @returns 恐慌与贪婪指数数据
   */
  async getFearGreedIndex(): Promise<FearGreedIndex | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market/fear-greed`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.detail || '获取恐慌与贪婪指数失败',
          response.status,
          errorData.error
        );
      }
      
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('获取恐慌与贪婪指数失败:', error);
      return null;
    }
  }
} 