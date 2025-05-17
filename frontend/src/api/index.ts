// 重新导出类型
export * from './types';

// 重新导出合约配置
export * from './contractConfig';

// 导出API客户端
import { ApiClient } from './apiClient';

// 创建一个API客户端的单例实例
export const apiClient = new ApiClient();

// 默认导出API客户端实例
export default apiClient; 