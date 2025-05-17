// 在文件顶部添加类型声明
declare global {
  interface Window {
    ethereum?: any;
  }
}

import React, { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import '../styles/TokenSwapWidget.css';
import { TradeItem } from '../api/types';

interface TokenSwapWidgetProps {
  trade?: TradeItem;
  trades?: TradeItem[];
  userAddress?: string;
  onComplete?: (success: boolean) => void;
  onClose?: () => void;
}

// 获取代币地址
const getTokenAddress = (symbol: string, chain: string | undefined): string => {
  const tokenMap: Record<string, Record<string, string>> = {
    ethereum: {
      'ETH': 'native',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    polygon: {
      'MATIC': 'native',
      'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    },
    bsc: {
      'BNB': 'native',
      'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    },
    arbitrum: {
      'ETH': 'native',
    },
  }
  
  if (!chain || !tokenMap[chain] || !tokenMap[chain][symbol]) {
    return symbol;
  }
  
  return tokenMap[chain][symbol];
}

// 获取链ID
const getChainId = (chain: string | undefined): number => {
  const chainIds: Record<string, number> = {
    'ethereum': 1,
    'polygon': 137,
    'bsc': 56,
    'arbitrum': 42161,
  }
  
  return chain ? (chainIds[chain] || 1) : 1;
}

// 获取区块浏览器URL
const getExplorerUrl = (chain: string | undefined, txHash: string): string => {
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    bsc: 'https://bscscan.com/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
  }
  
  const baseUrl = chain && explorers[chain] ? explorers[chain] : 'https://etherscan.io/tx/';
  return `${baseUrl}${txHash}`;
}

export function TokenSwapWidget({ trade, trades, userAddress, onComplete, onClose }: TokenSwapWidgetProps) {
  const [activeTradeIndex, setActiveTradeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const { address } = useAccount();
  const effectiveAddress = userAddress || address;
  
  // 当前交易
  const currentTrade = trade || (trades && trades[activeTradeIndex]);
  
  // 判断是否处于批量交易模式
  const isBatchMode = !!trades && trades.length > 0;
  
  // 检查是否是跨链交易
  const isCrossChain = currentTrade && currentTrade.fromChain !== currentTrade.toChain;
  
  // 使用useMemo缓存交易URL，只有当交易相关信息变化时才重新计算
  const swapUrl = useMemo(() => {
    if (!currentTrade) return '';
    
    // 跨链交易，使用Across等专业跨链平台
    if (isCrossChain) {
      return `https://app.across.to/?from=${currentTrade.fromChain}&to=${currentTrade.toChain}&amount=${currentTrade.amount}&token=${currentTrade.fromAsset}`;
    }
    
    // 将token地址转换为小写
    const fromTokenAddress = getTokenAddress(currentTrade.fromAsset, currentTrade.fromChain);
    const toTokenAddress = getTokenAddress(currentTrade.toAsset, currentTrade.fromChain);
    
    // 同链交易，根据不同链选择合适的DEX
    switch(currentTrade.fromChain) {
      case 'ethereum':
        return `https://app.uniswap.org/#/swap?inputCurrency=${fromTokenAddress}&outputCurrency=${toTokenAddress}&exactAmount=${currentTrade.amount}`;
      case 'polygon':
        // 更新为QuickSwap新的URL格式
        return `https://dapp.quickswap.exchange/swap/v2/${fromTokenAddress}/${toTokenAddress}`;
      case 'bsc':
        return `https://pancakeswap.finance/swap?inputCurrency=${fromTokenAddress}&outputCurrency=${toTokenAddress}`;
      case 'arbitrum':
        return `https://app.sushi.com/swap?inputCurrency=${fromTokenAddress}&outputCurrency=${toTokenAddress}`;
      default:
        return `https://app.1inch.io/#/${getChainId(currentTrade.fromChain)}/simple/swap/${currentTrade.fromAsset}/${currentTrade.toAsset}`;
    }
  }, [currentTrade, isCrossChain]);
  
  // 处理交易
  const handleSwap = async () => {
    if (!currentTrade) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 检查用户是否已连接钱包
      if (!effectiveAddress) {
        setError('请先连接钱包');
        onComplete?.(false);
        setIsLoading(false);
        return;
      }
      
      // 尝试打开新窗口并检查是否成功
      const newWindow = window.open(swapUrl, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        setError('弹出窗口被阻止，请允许浏览器弹出窗口或手动复制链接');
        
        // 提供手动复制的链接
        navigator.clipboard.writeText(swapUrl)
          .catch(() => {
            // 复制失败时的静默处理
          });
      } else {
        // 假设交易成功
        if (isBatchMode && trades && activeTradeIndex < trades.length - 1) {
          setActiveTradeIndex(activeTradeIndex + 1);
        } else {
          onComplete?.(true);
        }
      }
      
    } catch (error: any) {
      setError(error.message || '交换过程中发生错误');
      onComplete?.(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理下一笔交易
  const handleNext = () => {
    if (trades && activeTradeIndex < trades.length - 1) {
      setActiveTradeIndex(activeTradeIndex + 1);
      setTxHash(null);
      setError(null);
    }
  };
  
  // 添加防止滚动的副作用
  useEffect(() => {
    // 禁用背景滚动
    document.body.style.overflow = 'hidden';
    
    // 清理函数，恢复滚动
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  if (!currentTrade) {
    return (
      <div className="token-swap-modal-overlay" onClick={onClose}>
        <div className="token-swap-modal" onClick={e => e.stopPropagation()}>
          <div className="token-swap-header">
            <h3>代币交换</h3>
            {onClose && <button className="close-button" onClick={onClose}>×</button>}
          </div>
          <div className="token-swap-content">
            <div className="no-trade-message">没有可用的交易详情</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="token-swap-modal-overlay" onClick={onClose}>
      <div className="token-swap-modal" onClick={e => e.stopPropagation()}>
        <div className="token-swap-header">
          <h3>代币交换</h3>
          {onClose && <button className="close-button" onClick={onClose}>×</button>}
        </div>
        
        <div className="token-swap-content">
          {isBatchMode && (
            <div className="batch-indicator">
              交易 {activeTradeIndex + 1} / {trades?.length}
            </div>
          )}
          
          <div className="trade-details">
            <div className="token-amount">
              <span className="label">从</span>
              <div className="value-container">
                <span className="token-value">{currentTrade.amount}</span>
                <span className="token-symbol">{currentTrade.fromAsset}</span>
                {currentTrade.fromChain && (
                  <span className="chain-name">({currentTrade.fromChain})</span>
                )}
              </div>
            </div>
            
            <div className="arrow">→</div>
            
            <div className="token-amount">
              <span className="label">到</span>
              <div className="value-container">
                <span className="token-symbol">{currentTrade.toAsset}</span>
                {currentTrade.toChain && (
                  <span className="chain-name">({currentTrade.toChain})</span>
                )}
              </div>
            </div>
            
            {currentTrade.reason && (
              <div className="trade-reason">
                <span className="label">原因:</span>
                <span className="value">{currentTrade.reason}</span>
              </div>
            )}
            
            {isCrossChain && (
              <div className="cross-chain-message">
                这是一个跨链交易。我们将引导您前往专业的跨链平台完成此交易。
              </div>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {txHash && (
            <div className="transaction-success">
              <p>交易已提交!</p>
              <a 
                href={getExplorerUrl(currentTrade.fromChain, txHash)} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                在区块浏览器中查看
              </a>
            </div>
          )}
          
          <div className="action-buttons">
            <button
              className="swap-button"
              onClick={handleSwap}
              disabled={isLoading}
            >
              {isLoading ? '处理中...' : '执行交换'}
            </button>
            
            {error && error.includes('弹出窗口被阻止') && (
              <button
                className="copy-link-button"
                onClick={() => {
                  navigator.clipboard.writeText(swapUrl)
                    .then(() => {
                      alert('交易链接已复制，请手动粘贴到浏览器打开');
                    })
                    .catch(() => {
                      alert('复制失败，请手动打开：' + swapUrl);
                    });
                }}
              >
                复制交易链接
              </button>
            )}
            
            {isBatchMode && trades && activeTradeIndex < trades.length - 1 && (
              <button 
                className="next-button"
                onClick={handleNext}
              >
                下一笔交易
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 