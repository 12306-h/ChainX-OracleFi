import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useReadContracts, useBalance, useBlockNumber } from 'wagmi'
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell, Label } from 'recharts'
import { 
  SUPPORTED_TOKENS, 
  TOKEN_ABI, 
  TokenInfo, 
  SUPPORTED_CHAINS, 
  getTokenPrice, 
  getNativeCurrencyPrice,
  updateAllTokenPrices
} from '../config/tokens'
import '../styles/TokenBalances.css'

// 柱状图颜色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B66FF', '#FFD166'];

// 在组件顶部添加类型定义
interface TokenBalance {
  token: TokenInfo;
  balance: number;
  value: number;
}

export function TokenBalances() {
  const { address, chainId: _chainId } = useAccount()
  const [balances, setBalances] = useState<{[key: string]: TokenBalance}>({})
  const [totalValue, setTotalValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [pricesUpdated, setPricesUpdated] = useState(false)

  // 获取当前区块号，用于监听链上变化
  const { data: blockNumber } = useBlockNumber({ watch: true })

  // 过滤掉测试网络，只保留主网
  const mainnetChains = SUPPORTED_CHAINS.filter(chain => !chain.isTestnet)

  // 获取所有支持链上的所有代币，排除测试网
  const allTokens = Object.entries(SUPPORTED_TOKENS)
    .filter(([key]) => !SUPPORTED_CHAINS.find(chain => chain.key === key && chain.isTestnet)) 
    .flatMap(([_, tokens]) => tokens)
  
  // 准备合约读取请求 (仅ERC20代币)
  const erc20Tokens = allTokens.filter(token => token.address !== 'native')
  const contracts = erc20Tokens.map(token => ({
    address: token.address as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: token.chainId
  }))

  // 获取ERC20代币余额
  const { data: erc20Data, isError: isErc20Error, isPending: isErc20Pending, refetch: refetchErc20 } = useReadContracts({
    contracts,
    query: {
      enabled: Boolean(address),
      refetchInterval: 30000, // 每30秒自动刷新一次
    }
  })

  // 获取原生代币余额
  const nativeTokens = mainnetChains.map(chain => ({
    chainId: chain.id,
    symbol: chain.nativeCurrency?.symbol || 'ETH',
    name: chain.nativeCurrency?.name || 'Ethereum',
    decimals: chain.nativeCurrency?.decimals || 18,
    chainKey: chain.key
  }))

  // 为每条链直接声明余额hooks (不在循环或useMemo中使用hooks)
  // 以太坊主网余额
  const ethMainnetHook = useBalance({
    address,
    chainId: 1, // 以太坊主网ID
    query: {
      enabled: Boolean(address),
      refetchInterval: 30000
    }
  });
  
  // BSC主网余额
  const bscMainnetHook = useBalance({
    address,
    chainId: 56, // BSC主网ID
    query: {
      enabled: Boolean(address),
      refetchInterval: 30000
    }
  });
  
  // Polygon主网余额
  const polygonMainnetHook = useBalance({
    address,
    chainId: 137, // Polygon主网ID
    query: {
      enabled: Boolean(address),
      refetchInterval: 30000
    }
  });
  
  // Arbitrum主网余额
  const arbitrumMainnetHook = useBalance({
    address,
    chainId: 42161, // Arbitrum主网ID
    query: {
      enabled: Boolean(address),
      refetchInterval: 30000
    }
  });
  
  // 使用useMemo整合原生代币余额数据，而不是在useMemo中调用hook
  const nativeBalances = useMemo(() => {
    return [
      {
        data: ethMainnetHook.data,
        isError: ethMainnetHook.isError,
        isLoading: ethMainnetHook.isLoading,
        refetch: ethMainnetHook.refetch,
        token: nativeTokens.find(t => t.chainId === 1) || {
          chainId: 1,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          chainKey: 'ethereum'
        }
      },
      {
        data: bscMainnetHook.data,
        isError: bscMainnetHook.isError,
        isLoading: bscMainnetHook.isLoading, 
        refetch: bscMainnetHook.refetch,
        token: nativeTokens.find(t => t.chainId === 56) || {
          chainId: 56,
          symbol: 'BNB',
          name: 'Binance Coin',
          decimals: 18,
          chainKey: 'bsc'
        }
      },
      {
        data: polygonMainnetHook.data,
        isError: polygonMainnetHook.isError,
        isLoading: polygonMainnetHook.isLoading,
        refetch: polygonMainnetHook.refetch,
        token: nativeTokens.find(t => t.chainId === 137) || {
          chainId: 137,
          symbol: 'MATIC',
          name: 'Polygon',
          decimals: 18,
          chainKey: 'polygon'
        }
      },
      {
        data: arbitrumMainnetHook.data,
        isError: arbitrumMainnetHook.isError,
        isLoading: arbitrumMainnetHook.isLoading,
        refetch: arbitrumMainnetHook.refetch,
        token: nativeTokens.find(t => t.chainId === 42161) || {
          chainId: 42161,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          chainKey: 'arbitrum'
        }
      }
    ];
  }, [
    ethMainnetHook.data, ethMainnetHook.isError, ethMainnetHook.isLoading, ethMainnetHook.refetch,
    bscMainnetHook.data, bscMainnetHook.isError, bscMainnetHook.isLoading, bscMainnetHook.refetch,
    polygonMainnetHook.data, polygonMainnetHook.isError, polygonMainnetHook.isLoading, polygonMainnetHook.refetch,
    arbitrumMainnetHook.data, arbitrumMainnetHook.isError, arbitrumMainnetHook.isLoading, arbitrumMainnetHook.refetch,
    nativeTokens
  ]);

  // 计算余额和总价值（不获取新数据）
  const refreshBalances = useCallback(() => {
    if (!address) return;
    
    // 初始化新的余额对象
    const newBalances: {[key: string]: TokenBalance} = {}
    let newTotalValue = 0
    
    // 处理ERC20代币余额
    if (erc20Data) {
      erc20Data.forEach((result, index) => {
        const token = erc20Tokens[index]
        if (result.status === 'success' && result.result) {
          const rawBalance = result.result
          const formattedBalance = Number(rawBalance.toString()) / Math.pow(10, token.decimals)
          
          // 获取最新价格
          const price = getTokenPrice(token.chainKey, token.symbol);
          const value = formattedBalance * price;
          
          if (formattedBalance > 0) {
            newBalances[token.symbol + '-' + token.chainKey] = {
              token: {
                ...token,
                price  // 使用最新价格
              },
              balance: formattedBalance,
              value
            }
            newTotalValue += value
          }
        }
      })
    }
    
    // 处理原生代币余额
    nativeBalances.forEach(({ data, isError, token }) => {
      if (data && !isError) {
        const formattedBalance = Number(data.formatted)
        // 获取最新价格
        const price = getNativeCurrencyPrice(token.chainKey);
        const value = formattedBalance * price;
        
        if (formattedBalance > 0) {
          newBalances[token.symbol + '-' + token.chainKey] = {
            token: {
              symbol: token.symbol,
              name: token.name,
              address: 'native',
              decimals: token.decimals,
              chainKey: token.chainKey,
              chainId: token.chainId,
              price  // 使用最新价格
            },
            balance: formattedBalance,
            value
          }
          newTotalValue += value
        }
      }
    })
    
    setBalances(newBalances)
    setTotalValue(newTotalValue)
    setIsLoading(false)
    
    if (pricesUpdated) {
      setPricesUpdated(false);
    }
  }, [address, erc20Data, erc20Tokens, nativeBalances, pricesUpdated]);

  // 刷新价格数据并重新计算资产价值
  const refreshPrices = useCallback(async () => {
    setIsLoading(true);
    await updateAllTokenPrices();
    setPricesUpdated(true);
    
    // 触发余额重新计算
    refreshBalances();
  }, [refreshBalances]);

  // 手动刷新所有余额
  const refreshAllBalances = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    
    // 刷新价格数据
    await updateAllTokenPrices();
    setPricesUpdated(true);
    
    // 刷新ERC20代币余额
    refetchErc20();
    
    // 刷新所有原生代币余额
    nativeBalances.forEach(({ refetch }) => refetch());
    
    setLastRefreshTime(new Date());
  }, [address, refetchErc20, nativeBalances]);

  // 当区块号变化时，自动刷新余额
  useEffect(() => {
    if (blockNumber && address) {
      // 不直接调用refreshAllBalances以避免无限循环
      // 只刷新ERC20和native token的余额，不重新计算
      refetchErc20();
      nativeBalances.forEach(({ refetch }) => refetch());
      setLastRefreshTime(new Date());
    }
  }, [blockNumber, address, refetchErc20]);

  // 确保一进入组件就立即更新价格
  useEffect(() => {
    // 组件首次加载时立即更新价格
    updateAllTokenPrices().then(() => {
      if (address) {
        refreshBalances();
      }
    });
    // 空依赖数组确保只在组件挂载时运行一次
  }, []);

  // 当数据变化时计算余额
  useEffect(() => {
    if (address) {
      setIsLoading(true);
      // 使用memoized值或缓存的引用，避免直接依赖nativeBalances
      refreshBalances();
    }
    // 仅当真正需要更新的数据变化时才重新计算
  }, [address, erc20Data]);  // 移除 nativeBalances 依赖

  // 当native token余额变化时单独处理
  useEffect(() => {
    if (address && !isLoading) {
      refreshBalances();
    }
  }, [nativeBalances.map(item => item.data?.formatted).join(','), address, isLoading]);

  // 设置自动更新时间显示
  useEffect(() => {
    // 初始设置最后更新时间
    setLastRefreshTime(new Date());
    
    // 每30秒更新一次时间
    const timeUpdateInterval = setInterval(() => {
      setLastRefreshTime(new Date());
    }, 30000);
    
    return () => clearInterval(timeUpdateInterval);
  }, []);

  // 准备柱状图数据
  const barData = Object.values(balances).map((item, index) => {
    const percentage = (item.value / totalValue) * 100;
    return {
      name: `${item.token.symbol}\n(${item.token.chainKey})`,
      value: item.value,
      percentage: percentage,
      balance: item.balance,
      symbol: item.token.symbol,
      chainKey: item.token.chainKey,
      price: item.token.price,
      fill: COLORS[index % COLORS.length]
    };
  }).sort((a, b) => b.value - a.value); // 按价值降序排序

  // 按链分组的余额数据
  const balancesByChain = Object.values(balances).reduce((acc, item) => {
    const chainKey = item.token.chainKey
    if (!acc[chainKey]) {
      acc[chainKey] = {
        tokens: [],
        totalValue: 0
      }
    }
    acc[chainKey].tokens.push(item)
    acc[chainKey].totalValue += item.value
    return acc
  }, {} as {[key: string]: {tokens: TokenBalance[], totalValue: number}})

  // 当价格数据为0时显示加载中
  const isPriceLoading = useCallback(() => {
    // 检查是否有代币价格为0
    const hasZeroPrice = barData.some(item => item.price === 0);
    return hasZeroPrice;
  }, [barData]);

  if (!address) {
    return <div className="token-balances">请先连接钱包</div>
  }

  return (
    <div className="token-balances">
      <div className="dashboard-header">
        <h2><span className="dashboard-icon">📊</span> 资产占比图</h2>
        <div className="dashboard-actions">
          <div className="total-value-card">
            <div className="total-value-label">总资产估值</div>
            <div className="total-value-amount">
              {isPriceLoading() ? '加载中...' : `$${totalValue.toFixed(2)}`}
            </div>
          </div>
          {lastRefreshTime && (
            <div className="update-info">
              <span className="refresh-indicator"></span>
              每30秒自动更新 | 上次更新: {lastRefreshTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      {isLoading || isErc20Pending || nativeBalances.some(b => b.isLoading) ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载资产数据...</p>
        </div>
      ) : isErc20Error || nativeBalances.some(b => b.isError) ? (
        <div className="error-container">
          <p>获取余额时出错，请检查钱包连接并重试</p>
        </div>
      ) : barData.length === 0 ? (
        <div className="empty-state">
          <p>未找到任何代币余额</p>
          <p>请确保您的钱包中有受支持的代币</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="chart-card">
              <div className="pie-chart-section">
                <h3>资产</h3>
                <div className="pie-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 20, right: 60, left: -20, bottom: 20 }}>
                      <Pie
                        data={barData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        labelLine={{ stroke: '#2c3e50', strokeWidth: 1 }}
                      >
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          const data = props.payload;
                          return [
                            <>
                              <div style={{ color: '#2c3e50', fontWeight: 600 }}>${value.toFixed(2)}</div>
                              <div style={{ fontSize: '0.9em', color: '#4a5568', marginTop: '4px' }}>
                                占比: {(data.percent * 100).toFixed(2)}%
                              </div>
                              <div style={{ fontSize: '0.9em', color: '#4a5568' }}>
                                数量: {data.payload.balance.toFixed(4)} {data.payload.symbol}
                              </div>
                              <div style={{ fontSize: '0.9em', color: '#4a5568' }}>
                                价格: ${data.payload.price.toFixed(2)}
                              </div>
                            </>,
                            data.payload.name
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="asset-proportion-section">
                <h3>资产比例</h3>
                <div className="asset-proportion-list">
                  {barData.map((item, index) => (
                    <div key={index} className="proportion-item">
                      <div className="proportion-info">
                        <span className="proportion-symbol">{item.symbol}</span>
                        <span className="proportion-chain">({item.chainKey})</span>
                      </div>
                      <div className="proportion-value">
                        <span className="proportion-percentage">{item.percentage.toFixed(1)}%</span>
                        <span className="proportion-amount">${item.value.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="asset-list-card">
              <h3>资产详情</h3>
              <div className="asset-list">
                {Object.entries(balancesByChain).map(([chainKey, { tokens, totalValue }]) => (
                  <div key={chainKey} className="chain-assets">
                    <div className="chain-header">
                      <h4>{SUPPORTED_CHAINS.find(c => c.key === chainKey)?.name || chainKey}</h4>
                      <span className="chain-total">${totalValue.toFixed(2)}</span>
                    </div>
                    <ul className="token-list">
                      {tokens.map(item => (
                        <li key={item.token.symbol} className="token-item">
                          <div className="token-info">
                            <span className="token-symbol">{item.token.symbol}</span>
                            <span className="token-balance">{item.balance.toFixed(4)}</span>
                          </div>
                          <div className="token-value">
                            <span className="token-price">${item.token.price.toFixed(2)}</span>
                            <span className="token-total-value">${item.value.toFixed(2)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 