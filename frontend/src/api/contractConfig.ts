// AI智能合约地址
export const AI_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';

// 合约ABI 
export const AI_CONTRACT_ABI = [
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "requestHash", "type": "bytes32" },
      { "name": "cid", "type": "string" },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "recordRequest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "name": "getUserRequests",
    "outputs": [
      { "name": "requestHashes", "type": "bytes32[]" },
      { "name": "cids", "type": "string[]" },
      { "name": "timestamps", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": false, "name": "requestHash", "type": "bytes32" },
      { "indexed": false, "name": "cid", "type": "string" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "RequestRecorded",
    "type": "event"
  }
] as const;

/**
 * 生成Etherscan链接
 * @param txHash 交易哈希
 * @returns Etherscan链接
 */
export const getEtherscanLink = (txHash: string) => {
  // 根据环境变量决定使用哪个网络的Etherscan
  const baseUrl = import.meta.env.VITE_NETWORK_NAME === 'sepolia'
    ? 'https://sepolia.etherscan.io'
    : 'https://etherscan.io';
  
  return `${baseUrl}/tx/${txHash}`;
}; 