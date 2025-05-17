// 支持的区块链网络
export interface NetworkConfig {
  id: number;
  name: string;
  key: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet?: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    price: number; // 将由实时数据更新
    coingeckoId?: string; // 添加CoinGecko ID
  };
}

export const SUPPORTED_CHAINS: NetworkConfig[] = [
  {
    id: 1,
    name: '以太坊主网',
    key: 'ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      price: 0, // 初始化为0，将由实时数据更新
      coingeckoId: 'ethereum'
    }
  },
  {
    id: 11155111,
    name: 'Sepolia测试网',
    key: 'sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    isTestnet: true,
    nativeCurrency: {
      name: 'Sepolia Ether', 
      symbol: 'ETH',
      decimals: 18,
      price: 0, // 初始化为0，将由实时数据更新
      coingeckoId: 'ethereum'
    }
  },
  {
    id: 56,
    name: 'BNB智能链',
    key: 'bsc',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
      price: 0, // 初始化为0，将由实时数据更新
      coingeckoId: 'binancecoin'
    }
  },
  {
    id: 137,
    name: 'Polygon',
    key: 'polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'POL',
      decimals: 18,
      price: 0, // 初始化为0，将由实时数据更新
      coingeckoId: 'matic-network'
    }
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    key: 'arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      price: 0, // 初始化为0，将由实时数据更新
      coingeckoId: 'ethereum'
    }
  },
  {
    id: 5000,
    name: 'Mantle',
    key: 'mantle',
    rpcUrl: 'https://rpc.mantle.xyz',
    blockExplorer: 'https://explorer.mantle.xyz',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
      price: 0, // 初始化为0，将由实时数据更新
      coingeckoId: 'mantle'
    }
  }
]

// 代币类型定义
export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  chainKey: string;
  price: number;      // 初始化为0，将由实时数据更新
  coingeckoId?: string; // CoinGecko ID用于获取实时价格
  lastUpdated?: number; // 最后价格更新时间戳
}

// 支持的代币
export const SUPPORTED_TOKENS: { [key: string]: TokenInfo[] } = {
  ethereum: [
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      price: 0,
      coingeckoId: 'ethereum'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      chainId: 1,
      chainKey: 'ethereum',
      price: 0,
      coingeckoId: 'tether'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      chainId: 1,
      chainKey: 'ethereum',
      price: 0,
      coingeckoId: 'usd-coin'
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      price: 0,
      coingeckoId: 'dai'
    }
  ],
  bsc: [
    {
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      price: 0,
      coingeckoId: 'binancecoin'
    },
    {
      symbol: 'USDT',
      name: 'Binance-Peg BSC-USD',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      chainKey: 'bsc',
      chainId: 56,
      price: 0,
      coingeckoId: 'tether'
    },
    {
      symbol: 'BUSD',
      name: 'Binance USD',
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      decimals: 18,
      chainKey: 'bsc',
      chainId: 56,
      price: 0,
      coingeckoId: 'binance-usd'
    },
    {
      symbol: 'CAKE',
      name: 'PancakeSwap Token',
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      decimals: 18,
      chainKey: 'bsc',
      chainId: 56,
      price: 0,
      coingeckoId: 'pancakeswap-token'
    }
  ],
  polygon: [
    {
      symbol: 'WPOL',
      name: 'Wrapped Polygon',
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 
      decimals: 18,
      chainId: 137,
      chainKey: 'polygon',
      price: 0,
      coingeckoId: 'matic-network'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
      chainKey: 'polygon',
      chainId: 137,
      price: 0,
      coingeckoId: 'tether'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      decimals: 6,
      chainKey: 'polygon',
      chainId: 137,
      price: 0,
      coingeckoId: 'usd-coin'
    },
    {
      symbol: 'USDC.e',
      name: 'USD Coin(PoS)',
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      decimals: 6,
      chainKey: 'polygon',
      chainId: 137,
      price: 0,
      coingeckoId: 'usd-coin'
    }
    // {
    //   symbol: 'MATIC',
    //   name: 'MATIC Token',
    //   address: '0x0000000000000000000000000000000000001010',
    //   decimals: 18,
    //   chainKey: 'polygon',
    //   chainId: 137,
    //   price: 0,
    //   coingeckoId: 'matic-network'
    // }
  ],
  arbitrum: [
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimals: 18,
      chainId: 42161,
      chainKey: 'arbitrum',
      price: 0,
      coingeckoId: 'ethereum'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      decimals: 6,
      chainKey: 'arbitrum',
      chainId: 42161,
      price: 0,
      coingeckoId: 'tether'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      decimals: 6,
      chainKey: 'arbitrum',
      chainId: 42161,
      price: 0,
      coingeckoId: 'usd-coin'
    },
    {
      symbol: 'ARB',
      name: 'Arbitrum',
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      decimals: 18,
      chainKey: 'arbitrum',
      chainId: 42161,
      price: 0,
      coingeckoId: 'arbitrum'
    }
  ],
  mantle: [
    {
      symbol: 'WMNT',
      name: 'Wrapped Mantle',
      address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
      decimals: 18,
      chainId: 5000,
      chainKey: 'mantle',
      price: 0,
      coingeckoId: 'mantle'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
      decimals: 6,
      chainKey: 'mantle',
      chainId: 5000,
      price: 0,
      coingeckoId: 'tether'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
      decimals: 6,
      chainKey: 'mantle',
      chainId: 5000,
      price: 0,
      coingeckoId: 'usd-coin'
    },
    {
      symbol: 'MNT',
      name: 'Mantle',
      address: '0x3c3a81e81dc49A522A592e7622A7E711c06bf354',
      decimals: 18,
      chainKey: 'mantle',
      chainId: 5000,
      price: 0,
      coingeckoId: 'mantle'
    }
  ],
  // 注释掉测试网代币配置，这些测试币没有实际价值
  /*
  sepolia: [
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // Sepolia上的WETH地址
      decimals: 18,
      chainId: 11155111,
      chainKey: 'sepolia',
      price: 0,
      coingeckoId: 'ethereum'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD (Test)',
      address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // 仅用于演示
      decimals: 6,
      chainId: 11155111,
      chainKey: 'sepolia',
      price: 0,
      coingeckoId: 'tether'
    },
    {
      symbol: 'IAUSD',
      name: 'Investment Advisor USD',
      address: '0x950c656375dbeb78a59a498c69df136fc35f9fcc', // 使用合约地址作为测试代币
      decimals: 18,
      chainId: 11155111,
      chainKey: 'sepolia',
      price: 0
    }
  ]
  */
}

// 价格缓存对象，用于存储实时价格
interface PriceCache {
  [coingeckoId: string]: {
    price: number;
    lastUpdated: number;
  };
}

const priceCache: PriceCache = {};

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

/**
 * 从CoinGecko API获取代币价格
 * @param coingeckoIds 要获取价格的代币ID数组
 * @returns 代币ID到价格的映射
 */
export async function fetchTokenPrices(coingeckoIds: string[]): Promise<{[id: string]: number}> {
  try {
    // 过滤掉已经有缓存且未过期的ID
    const now = Date.now();
    const idsToFetch = coingeckoIds.filter(id => {
      const cached = priceCache[id];
      return !cached || (now - cached.lastUpdated > CACHE_EXPIRY);
    });

    if (idsToFetch.length === 0) {
      // 所有ID都有缓存，直接返回缓存的价格
      return coingeckoIds.reduce((prices, id) => {
        prices[id] = priceCache[id]?.price || 0;
        return prices;
      }, {} as {[id: string]: number});
    }

    // 构建CoinGecko API URL
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 更新缓存
    idsToFetch.forEach(id => {
      if (data[id] && data[id].usd) {
        priceCache[id] = {
          price: data[id].usd,
          lastUpdated: now
        };
      }
    });
    
    // 合并缓存和新获取的价格
    return coingeckoIds.reduce((prices, id) => {
      prices[id] = priceCache[id]?.price || 0;
      return prices;
    }, {} as {[id: string]: number});
  } catch (error) {
    console.error('获取代币价格失败:', error);
    // 出错时返回空对象
    return {};
  }
}

/**
 * 更新所有支持代币的价格
 */
export async function updateAllTokenPrices(): Promise<void> {
  try {
    // 收集所有需要更新的coingeckoId
    const allIds = new Set<string>();
    
    // 添加原生货币ID
    SUPPORTED_CHAINS.forEach(chain => {
      if (chain.nativeCurrency.coingeckoId) {
        allIds.add(chain.nativeCurrency.coingeckoId);
      }
    });
    
    // 添加代币ID
    Object.values(SUPPORTED_TOKENS).forEach(tokens => {
      tokens.forEach(token => {
        if (token.coingeckoId) {
          allIds.add(token.coingeckoId);
        }
      });
    });
    
    const idsArray = Array.from(allIds);
    const prices = await fetchTokenPrices(idsArray);
    
    // 更新原生货币价格
    SUPPORTED_CHAINS.forEach(chain => {
      if (chain.nativeCurrency.coingeckoId && prices[chain.nativeCurrency.coingeckoId]) {
        chain.nativeCurrency.price = prices[chain.nativeCurrency.coingeckoId];
      }
    });
    
    // 更新代币价格
    Object.values(SUPPORTED_TOKENS).forEach(tokens => {
      tokens.forEach(token => {
        if (token.coingeckoId && prices[token.coingeckoId]) {
          token.price = prices[token.coingeckoId];
          token.lastUpdated = Date.now();
        }
      });
    });
  } catch (error) {
    console.error('更新所有代币价格失败:', error);
  }
}

/**
 * 获取代币的当前价格
 * @param chainKey 链标识
 * @param symbol 代币符号
 * @returns 代币价格，如果找不到则返回0
 */
export function getTokenPrice(chainKey: string, symbol: string): number {
  const tokens = SUPPORTED_TOKENS[chainKey];
  if (!tokens) return 0;
  
  const token = tokens.find(t => t.symbol === symbol);
  return token?.price || 0;
}

/**
 * 获取原生货币价格
 * @param chainKey 链标识
 * @returns 原生货币价格，如果找不到则返回0
 */
export function getNativeCurrencyPrice(chainKey: string): number {
  const chain = SUPPORTED_CHAINS.find(c => c.key === chainKey);
  return chain?.nativeCurrency.price || 0;
}

// ERC20代币ABI
export const TOKEN_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
    stateMutability: "view"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
    stateMutability: "view"
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
    stateMutability: "view"
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
    stateMutability: "view"
  }
] as const; 