import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount, useBalance, useReadContracts, useBlockNumber } from 'wagmi'
import { AdvisorRequestInput, CryptoAsset, apiClient, APIError, AllocationItem, TradeItem } from '../api'
import { SUPPORTED_TOKENS, TOKEN_ABI, TokenInfo, SUPPORTED_CHAINS } from '../config/tokens'
import '../styles/Sidebar.css'
import { TbAdjustmentsHorizontal } from 'react-icons/tb'
import { ApiClient } from '../api/apiClient'
import { TokenSwapWidget } from './TokenSwapWidget'

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// 消息类型
type MessageType = 'user' | 'ai' | 'system';

// 聊天消息接口
interface ChatMessage {
  type: MessageType;
  text: string;
  timestamp: number;
  allocation?: AllocationItem[];
  cid?: string;
  txHash?: string;
  trades?: TradeItem[];
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { isConnected, address, chainId: _chainId } = useAccount()
  
  // 获取当前区块号，用于监听链上变化
  const { data: blockNumber } = useBlockNumber({ watch: true })
  
  // 状态管理
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      type: 'ai', 
      text: '你好！我是你的投资顾问AI。我可以根据你的资产分布、风险偏好和个人需求给你投资建议。请在下方输入你的具体投资需求或问题，例如："我想要更保守的投资策略"或"我对DeFi项目感兴趣"。',
      timestamp: Date.now()
    }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium')
  // 新增状态：是否显示风险选择器弹出框
  const [showRiskSelector, setShowRiskSelector] = useState(false)
  
  // 资产相关状态
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: { token: TokenInfo, balance: number, value: number }}>({})
  const [totalValue, setTotalValue] = useState(0)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  
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
  const { data: erc20Data, refetch: refetchErc20 } = useReadContracts({
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
    price: chain.nativeCurrency?.price || 1, // 使用配置中的价格
    chainKey: chain.key
  }))
  
  // 直接在组件中为每条链声明余额hooks (不在循环中使用hooks)
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
  
  // 构建原生代币余额数组的引用
  const nativeBalancesRef = useRef<any[]>([]);
  
  // 刷新所有余额的函数
  const refreshAllBalances = useCallback(() => {
    if (!address) return;
    
    setIsLoadingBalances(true);
    
    // 刷新ERC20代币余额
    refetchErc20();
    
    // 刷新所有原生代币余额
    nativeBalancesRef.current.forEach(item => {
      if (item && typeof item.refetch === 'function') {
        item.refetch();
      }
    });
  }, [address, refetchErc20]);
  
  // 当区块号变化时，自动刷新余额
  useEffect(() => {
    if (blockNumber && address) {
      // 不直接调用refreshAllBalances以避免无限循环
      // 只刷新ERC20和native token的余额，不重新计算
      refetchErc20();
      nativeBalancesRef.current.forEach(item => {
        if (item && typeof item.refetch === 'function') {
          item.refetch();
        }
      });
    }
  }, [blockNumber, address, refetchErc20]);
  
  // 添加单独的Effect来监听原生代币余额变化
  useEffect(() => {
    if (address) {
      // 仅更新nativeBalancesRef，不触发余额计算
      nativeBalancesRef.current = [
        {
          data: ethMainnetHook.data,
          refetch: ethMainnetHook.refetch,
          token: nativeTokens.find(t => t.chainId === 1) || {
            chainId: 1,
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            price: 1,
            chainKey: 'ethereum'
          }
        },
        {
          data: bscMainnetHook.data,
          refetch: bscMainnetHook.refetch,
          token: nativeTokens.find(t => t.chainId === 56) || {
            chainId: 56,
            symbol: 'BNB',
            name: 'Binance Coin',
            decimals: 18,
            price: 1,
            chainKey: 'bsc'
          }
        },
        {
          data: polygonMainnetHook.data,
          refetch: polygonMainnetHook.refetch,
          token: nativeTokens.find(t => t.chainId === 137) || {
            chainId: 137,
            symbol: 'MATIC',
            name: 'Polygon',
            decimals: 18,
            price: 1,
            chainKey: 'polygon'
          }
        },
        {
          data: arbitrumMainnetHook.data,
          refetch: arbitrumMainnetHook.refetch,
          token: nativeTokens.find(t => t.chainId === 42161) || {
            chainId: 42161,
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            price: 1,
            chainKey: 'arbitrum'
          }
        }
      ];
    }
  }, [
    address,
    ethMainnetHook.data,
    bscMainnetHook.data,
    polygonMainnetHook.data,
    arbitrumMainnetHook.data,
    nativeTokens
  ]);
  
  // 添加单独的Effect来处理原生代币余额变化后的计算
  useEffect(() => {
    // 使用定时器和引用对比来防止无限循环
    let hasNativeBalances = nativeBalancesRef.current.length > 0 && 
                           nativeBalancesRef.current.some(item => item.data);
    
    if (hasNativeBalances && address && !isLoadingBalances) {
      // 使用请求ID跟踪本次计算，防止重复计算
      const requestId = Date.now();
      
      // 使用debounce防止频繁计算
      const timer = setTimeout(() => {
        // 检查组件是否仍然需要更新
        if (address) {

          
          // 标记为加载中
          setIsLoadingBalances(true);
          
          // 使用setTimeout将状态更新放入下一个事件循环
          setTimeout(() => {
            // 再次检查地址
            if (address) {
              // 使用函数式更新，避免依赖旧的状态值
              setTokenBalances(prev => {
                const newBalances = {...prev};
                let newTotalValue = 0;
                
                // 只处理原生代币余额，保留之前的ERC20余额
                Object.values(prev).forEach(item => {
                  if (item.token.address !== 'native') {
                    newTotalValue += item.value;
                  }
                });
                
                // 处理原生代币余额
                nativeBalancesRef.current.forEach(({ data, token }) => {
                  if (data) {
                    const formattedBalance = Number(data.formatted);
                    const value = formattedBalance * (token.price || 0);
                    
                    if (formattedBalance > 0) {
                      const tokenKey = token.symbol + '-' + token.chainKey;
                      
                      // 只有当余额或价格变化时才更新
                      const existingToken = prev[tokenKey];
                      if (!existingToken || 
                          existingToken.balance !== formattedBalance || 
                          existingToken.token.price !== token.price) {
                        
                        newBalances[tokenKey] = {
                          token: {
                            symbol: token.symbol,
                            name: token.name,
                            address: 'native',
                            decimals: token.decimals,
                            chainKey: token.chainKey,
                            chainId: token.chainId,
                            price: token.price
                          },
                          balance: formattedBalance,
                          value
                        };
                      } else {
                        // 保留原有数据减少不必要的渲染
                        newBalances[tokenKey] = existingToken;
                      }
                      
                      // 无论是否更新，都要计入总值
                      newTotalValue += value;
                    }
                  }
                });
                
                // 更新总值
                if (Math.abs(totalValue - newTotalValue) > 0.01) {
                  setTotalValue(newTotalValue);
                }
                
                return newBalances;
              });
            }
            
            // 完成加载
            setIsLoadingBalances(false);
          }, 0);
        }
      }, 500); // 增加debounce时间到500ms
      
      return () => clearTimeout(timer);
    }
  }, [
    address,
    // 使用JSON.stringify处理数据依赖，避免频繁触发
    JSON.stringify({
      eth: ethMainnetHook.data?.formatted,
      bsc: bscMainnetHook.data?.formatted,
      polygon: polygonMainnetHook.data?.formatted,
      arbitrum: arbitrumMainnetHook.data?.formatted
    }),
    isLoadingBalances,
    totalValue
  ]);
  
  // 处理ERC20代币余额
  useEffect(() => {
    if (!address || !erc20Data) return;
    
    setIsLoadingBalances(true);
    
    // 使用setTimeout避免状态更新冲突
    setTimeout(() => {
      // 使用函数式更新避免依赖旧状态
      setTokenBalances(prev => {
        const newBalances = {...prev};
        let newTotalValue = 0;
        
        // 保留现有的原生代币余额价值
        Object.values(prev).forEach(item => {
          if (item.token.address === 'native') {
            newTotalValue += item.value;
            newBalances[item.token.symbol + '-' + item.token.chainKey] = item;
          }
        });
        
        // 用于检测是否有实际变化的标志
        let hasChanges = false;
        
        // 处理ERC20代币余额
        erc20Data.forEach((result, index) => {
          const token = erc20Tokens[index];
          if (result.status === 'success' && result.result) {
            const rawBalance = result.result;
            const formattedBalance = Number(rawBalance.toString()) / Math.pow(10, token.decimals);
            
            // 获取或估算价格
            const price = token.price || 1; // 使用配置中的价格或默认为1
            const value = formattedBalance * price;
            
            if (formattedBalance > 0) {
              const tokenKey = token.symbol + '-' + token.chainKey;
              const existingToken = prev[tokenKey];
              
              // 检查是否有实际变化
              if (!existingToken || 
                  Math.abs(existingToken.balance - formattedBalance) > 0.0001 || 
                  Math.abs(existingToken.value - value) > 0.01) {
                
                hasChanges = true;
                newBalances[tokenKey] = {
                  token: {
                    ...token,
                    price // 确保价格被包含
                  },
                  balance: formattedBalance,
                  value
                };
              } else {
                // 保持现有值
                newBalances[tokenKey] = existingToken;
              }
              
              newTotalValue += value;
            }
          }
        });
        
        // 只在有实际变化时才输出日志
        if (hasChanges) {
          console.log('ERC20余额更新:', Object.values(newBalances)
            .filter(item => item.token.address !== 'native')
            .map(item => 
              `${item.token.symbol}(${item.token.chainKey}): ${item.balance.toFixed(4)}, 价值: $${item.value.toFixed(2)}`
            )
          );
        }
        
        // 设置总价值
        if (Math.abs(totalValue - newTotalValue) > 0.01) {
          setTotalValue(newTotalValue);
        }
        
        return newBalances;
      });
      
      setIsLoadingBalances(false);
    }, 10);
  }, [address, erc20Data, erc20Tokens, totalValue]);
  
  // 转换为API所需的CryptoAsset格式
  const calculateAssetDistribution = useCallback((): CryptoAsset[] => {
    const assets: CryptoAsset[] = [];

    
    // 如果没有令牌余额数据，返回默认资产数据
    if (Object.keys(tokenBalances).length === 0) {
      return [
        { symbol: 'ETH', percentage: 60, chain: 'ethereum', amount: 0 },
        { symbol: 'USDC', percentage: 40, chain: 'ethereum', amount: 0 }
      ];
    }
    
    // 计算资产分布
    Object.values(tokenBalances).forEach(item => {
      // 跳过零余额
      if (item.value === 0) return;
      
      // 确定链名称 - 优先使用chainKey
      let chain = 'ethereum'; // 默认
      if (item.token.chainKey) {
        chain = item.token.chainKey;
      } else if (item.token.chainId) {
        // 使用chainId查找链名称
        const chainInfo = SUPPORTED_CHAINS.find(c => c.id === item.token.chainId);
        chain = chainInfo?.key || 'ethereum';
      }
      
      // 计算百分比
      const percentage = (item.value / totalValue) * 100;
      
      // 如果百分比太小 (小于0.1%)，则跳过
      if (percentage < 0.1) return;
      
      assets.push({
        symbol: item.token.symbol,
        percentage: Number(percentage.toFixed(1)),
        chain: chain, // 使用上面确定的chain变量
        amount: Number(item.balance) || 0,
        price: item.token.price || (item.value / (Number(item.balance) || 1)) // 优先使用token.price
      });
    });
    
    // 如果没有资产，返回默认资产
    if (assets.length === 0) {
      return [
        { symbol: 'ETH', percentage: 100, chain: 'ethereum', amount: 0 }
      ];
    }
    
    // 确保百分比总和为100%
    const totalPercentage = assets.reduce((sum, asset) => sum + asset.percentage, 0);
    
    if (totalPercentage < 99.9 || totalPercentage > 100.1) {
      // 找到最大资产进行调整
      const maxAsset = assets.reduce((max, asset) => 
        asset.percentage > max.percentage ? asset : max, assets[0]);
      
      // 调整百分比使总和为100%
      maxAsset.percentage = Number((maxAsset.percentage + (100 - totalPercentage)).toFixed(1));
    }
    

    
    return assets;
  }, [tokenBalances, totalValue]);
  
  // 添加新状态用于交易处理
  const [showSwapWidget, setShowSwapWidget] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<TradeItem | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  
  // 发送消息处理
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // 添加用户消息到聊天记录
    setChatHistory(prev => [...prev, {
      type: 'user', 
      text: message,
      timestamp: Date.now()
    }]);
    
    // 使用变量，用于备份原始消息内容
    const userInput = message;
    setMessage('');
    
    // 获取资产数据
    const cryptoAssets = calculateAssetDistribution();
    
    // 创建投资请求
    const requestInput: AdvisorRequestInput = {
      riskLevel,
      amount: Math.round(totalValue), // 使用实际总资产价值
      cryptoAssets, // 使用实际资产分布
      userMessage: userInput // 添加用户的对话内容
    };
    
    // 将解析后的请求显示出来
    setChatHistory(prev => [...prev, {
      type: 'system',
      text: `正在处理您的请求：风险等级-${
        requestInput.riskLevel === 'low' ? '低' : 
        requestInput.riskLevel === 'medium' ? '中' : '高'
      }，总资产价值-${requestInput.amount}美元，当前加密货币资产分布：${
        requestInput.cryptoAssets.map(asset => 
          `${asset.symbol}: ${asset.percentage}% (${asset.chain}${asset.amount ? `, 数量: ${asset.amount.toFixed(4)}` : ''}${asset.price ? `, 价格: $${asset.price.toFixed(2)}` : ''})`
        ).join(', ')
      }`,
      timestamp: Date.now()
    }]);
    
    if (!isConnected || !address) {
      setChatHistory(prev => [...prev, {
        type: 'system',
        text: '请先连接您的钱包以获取投资建议。',
        timestamp: Date.now()
      }]);
      setIsProcessing(false);
      return;
    }
    
    // 调用API获取投资建议
    try {
      const response = await apiClient.getAdvice(address, requestInput);
      
      if (response.action === 'trade' && response.data?.trades) {
        // 处理交易执行响应
        const trades = response.data.trades;
        
          setChatHistory(prev => [...prev, {
            type: 'ai',
          text: response.data?.tradeSummary || response.data?.recommendation || '无法获取交易建议',
          timestamp: Date.now(),
          trades: trades,
            txHash: response.data?.txHash,
          cid: response.data?.cid
        }]);
        
        // 如果只有一个交易，可以自动显示交易界面
        if (trades.length === 1) {
          handleTradeClick(trades[0]);
        }
      } else {
        // 处理投资建议响应
        setChatHistory(prev => [...prev, {
          type: 'ai',
          text: response.data?.recommendation || '无法获取建议',
          timestamp: Date.now(),
          allocation: response.data?.allocation,
          txHash: response.data?.txHash,
          cid: response.data?.cid
        }]);
      }
    } catch (error) {
      let errorMessage = '获取投资建议时出错，请稍后再试。';
      
      if (error instanceof APIError) {
        errorMessage = error.message;
      }
      
      setChatHistory(prev => [...prev, {
        type: 'system',
        text: errorMessage,
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 处理交易点击事件
  const handleTradeClick = useCallback((trade: TradeItem) => {
    setSelectedTrade(trade);
    setShowSwapWidget(true);
    setShowOverlay(true);
  }, []);

  // 关闭交易窗口
  const handleCloseSwapWidget = useCallback(() => {
    setShowSwapWidget(false);
    setSelectedTrade(null);
    setShowOverlay(false);
  }, []);

  // 处理交易完成事件
  const handleTradeComplete = useCallback((success: boolean) => {
    if (success) {
      setChatHistory(prev => [...prev, {
        type: 'system',
        text: '✅ 交易执行成功！',
        timestamp: Date.now()
      }]);
    } else {
      setChatHistory(prev => [...prev, {
        type: 'system',
        text: '❌ 交易执行失败，请重试。',
        timestamp: Date.now()
      }]);
    }
    
    // 关闭交易窗口
    handleCloseSwapWidget();
  }, [handleCloseSwapWidget]);

  // 渲染资产分配建议
  const renderAllocation = useCallback((allocation: AllocationItem[]) => {
    return (
      <div className="allocation-container">
        <h4>推荐资产分配</h4>
        <div className="allocation-bars">
          {allocation.map((item, index) => (
            <div key={index} className="allocation-item">
              <div className="allocation-label">
                <span className="asset-name">{item.asset}</span>
                <span className="asset-percentage">{item.percentage}%</span>
              </div>
              <div className="allocation-detail">
                {item.chain && <span className="asset-chain" data-chain={item.chain}>{item.chain}</span>}
              </div>
              <div className="allocation-bar">
                <div 
                  className="allocation-fill"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: getAssetColor(item.asset)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, []);
  
  // 为不同资产分配不同颜色
  const getAssetColor = (asset: string) => {
    const colorMap: {[key: string]: string} = {
      'BTC': '#f7931a',
      'ETH': '#627eea',
      'USDC': '#2775ca',
      'XRP': '#23292f',
      'ADA': '#0033ad',
      'SOL': '#14f195',
      'AVAX': '#e84142',
      'DOT': '#e6007a'
    };
    
    return colorMap[asset] || '#888888'; // 默认颜色
  };
  
  // 渲染交易项
  const renderTradeItem = useCallback((trade: TradeItem) => {
    return (
      <div className="trade-item" onClick={() => handleTradeClick(trade)}>
        <div className="trade-header">
          <div className="trade-assets">
            <span className="from-asset">
              {trade.fromAsset}
              <span className="asset-chain" data-chain={trade.fromChain}>{trade.fromChain}</span>
            </span>
            <span className="arrow">→</span>
            <span className="to-asset">
              {trade.toAsset}
              <span className="asset-chain" data-chain={trade.toChain}>{trade.toChain}</span>
            </span>
          </div>
        </div>
        <div className="trade-detail">
          <div className="trade-amount">
            <strong>数量:</strong> {trade.amount} {trade.fromAsset}
            {trade.amountInUSD && <span className="amount-usd">(约 ${trade.amountInUSD.toFixed(2)})</span>}
          </div>
          {trade.reason && (
            <div className="trade-reason">
              <strong>原因:</strong> {trade.reason}
            </div>
          )}
        </div>
        <div className="execute-trade">点击执行</div>
      </div>
    );
  }, [handleTradeClick]);
  
  // 当侧边栏打开时，滚动到最新消息
  useEffect(() => {
    if (isOpen) {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  }, [isOpen, chatHistory]);
  
  // 切换风险选择器的显示/隐藏
  const toggleRiskSelector = useCallback(() => {
    setShowRiskSelector(prev => !prev);
  }, []);
  
  return (
    <>
      {/* 只有在连接钱包后才显示侧边栏切换按钮 */}
      {isConnected && (
        <button 
          className={`sidebar-toggle ${isOpen ? 'open' : ''}`} 
          onClick={onToggle}
          aria-label={isOpen ? '关闭AI助手' : '打开AI助手'}
        >
          <span className="toggle-icon">
            {isOpen ? '›' : '‹'}
          </span>
          <span className="toggle-text">AI投顾</span>
        </button>
      )}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>去中心化AI投顾</h3>
          {isConnected && (
            <button className="close-sidebar" onClick={onToggle}>×</button>
          )}
        </div>
        
        <div className="chat-container">
          <div className="chat-messages">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.type}`}>
                <div className="message-content">{msg.text}</div>
                {msg.allocation && renderAllocation(msg.allocation)}
                {msg.trades && (
                  <div className="trades-container">
                    <h4>交易计划</h4>
                    <div className="trades-list">
                      {msg.trades.map((trade, i) => (
                        <div key={i}>{renderTradeItem(trade)}</div>
                      ))}
                    </div>
                    {/* 添加批量处理所有交易的选项 */}
                    {msg.trades.length > 1 && (
                      <div className="batch-trade-option">
                        <button 
                          className="batch-trade-button"
                          onClick={() => {
                            // 打开交易组件处理所有交易
                            setShowSwapWidget(true);
                            setShowOverlay(true);
                            // 传递所有交易而不是单个交易
                            setSelectedTrade(null);
                          }}
                        >
                          一键批量处理所有交易
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {msg.cid && msg.txHash && (
                  <div className="message-metadata">
                    <a 
                      href={`https://ipfs.io/ipfs/${msg.cid}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="metadata-link"
                    >
                      查看IPFS数据
                    </a>
                    <button 
                      onClick={() => {
                        // 尝试使用API验证交易
                        try {
                          apiClient.verifyTransaction(msg.txHash as string)
                            .then(result => {
                              if (result.success && result.data) {
                                alert(`验证成功: 交易已在区块 ${result.data.blockNumber} 确认`);
                              } else {
                                // 如果API验证失败，回退到Etherscan查看
                                window.open(`https://etherscan.io/tx/${msg.txHash}`, '_blank');
                              }
                            })
                            .catch(() => {
                              // 出错时也回退到Etherscan
                              window.open(`https://etherscan.io/tx/${msg.txHash}`, '_blank');
                            });
                        } catch (error) {
                          // 出错时回退到Etherscan
                          window.open(`https://etherscan.io/tx/${msg.txHash}`, '_blank');
                        }
                      }}
                      className="metadata-link"
                    >
                      查看区块链交易
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 风险偏好选择弹出框 */}
          {isConnected && showRiskSelector && (
            <div className="risk-selector-popup">
              <div className="risk-selector-content">
                <div className="risk-selector-header">
                  <h4>选择风险承受能力</h4>
                  <button className="close-risk-selector" onClick={toggleRiskSelector}>×</button>
                </div>
                <div className="risk-options">
                  <label className={`risk-option ${riskLevel === 'low' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="risk" 
                      value="low" 
                      checked={riskLevel === 'low'} 
                      onChange={() => {
                        setRiskLevel('low');
                        setShowRiskSelector(false);
                      }} 
                    />
                    <span>保守</span>
                  </label>
                  <label className={`risk-option ${riskLevel === 'medium' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="risk" 
                      value="medium" 
                      checked={riskLevel === 'medium'} 
                      onChange={() => {
                        setRiskLevel('medium');
                        setShowRiskSelector(false);
                      }} 
                    />
                    <span>稳健</span>
                  </label>
                  <label className={`risk-option ${riskLevel === 'high' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="risk" 
                      value="high" 
                      checked={riskLevel === 'high'} 
                      onChange={() => {
                        setRiskLevel('high');
                        setShowRiskSelector(false);
                      }} 
                    />
                    <span>激进</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          <div className="chat-input">
            {isConnected && (
              <button 
                className={`risk-level-button ${riskLevel}`} 
                onClick={toggleRiskSelector}
                title="设置风险承受能力"
              >
                <span className="risk-icon"></span>
                <span className="risk-label">{
                  riskLevel === 'low' ? '保守' : 
                  riskLevel === 'medium' ? '稳健' : '激进'
                }</span>
              </button>
            )}
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="输入你的投资需求，我会给你专业建议..."
              disabled={isProcessing || !isConnected}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage(e)}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={isProcessing || !message.trim() || !isConnected}
              className={isProcessing ? 'processing' : ''}
            >
              {isProcessing ? '处理中...' : '发送'}
            </button>
          </div>
          {!isConnected && (
            <div className="chat-connect-notice">请先连接钱包以使用AI顾问</div>
          )}
        </div>
      </div>
      
      {/* 添加交易组件和背景遮罩 */}
      {showOverlay && <div className="swap-overlay" onClick={handleCloseSwapWidget}></div>}
      {showSwapWidget && (
        <TokenSwapWidget 
          trade={selectedTrade || undefined} 
          trades={selectedTrade ? undefined : chatHistory.find(msg => msg.trades)?.trades}
          userAddress={address || ''}
          onComplete={handleTradeComplete} 
          onClose={handleCloseSwapWidget} 
        />
      )}
    </>
  );
} 