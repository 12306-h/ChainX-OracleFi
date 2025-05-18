import { useState, useEffect, useRef } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { WalletOptions } from './WalletOptions'
import logo from '../assets/Logo.jpg'
import '../styles/Navbar.css'
import { apiClient, FearGreedIndex } from '../api'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 恐慌贪婪指数状态
  const [fearGreedData, setFearGreedData] = useState<FearGreedIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 获取恐慌贪婪指数
  useEffect(() => {
    async function fetchFearGreedIndex() {
      try {
        setLoading(true)
        const data = await apiClient.getFearGreedIndex()
        setFearGreedData(data)
        setError(null)
      } catch (err) {
        console.error('获取恐慌贪婪指数失败:', err)
        setError('无法加载市场数据')
      } finally {
        setLoading(false)
      }
    }
    
    fetchFearGreedIndex()
    
    // 每5分钟刷新一次数据
    const interval = setInterval(fetchFearGreedIndex, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // 根据指数确定显示文本和颜色
  const getFearLevel = (index: number) => {
    if (index < 25) return { text: '极度恐慌', color: '#e74c3c' }
    if (index < 40) return { text: '恐慌', color: '#e67e22' }
    if (index < 60) return { text: '中性', color: '#f1c40f' }
    if (index < 80) return { text: '贪婪', color: '#2ecc71' }
    return { text: '极度贪婪', color: '#27ae60' }
  }
  
  // 获取恐慌贪婪指数显示
  const fearIndex = fearGreedData?.value || 50
  const fearLevel = getFearLevel(fearIndex)
  
  const handleDisconnect = () => {
    disconnect()
    setShowDropdown(false)
  }
  
  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="Epoch Logo" className="navbar-logo" />
        <h1 className="navbar-title">OracleFi</h1>
      </div>
      
      <div className="navbar-center">
        <div className="fear-index">
          <span>市场情绪: </span>
          {loading ? (
            <span className="loading">加载中...</span>
          ) : error ? (
            <span className="error">数据获取失败</span>
          ) : (
            <span className="fear-level" style={{ color: fearLevel.color }}>
              {fearLevel.text} ({fearIndex})
            </span>
          )}
        </div>
      </div>
      
      <div className="navbar-right">
        {isConnected ? (
          <div className="wallet-address-container" ref={dropdownRef}>
            <div 
              className="wallet-address" 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
            </div>
            {showDropdown && (
              <div className="wallet-dropdown">
                <div className="dropdown-item full-address">
                  <span className="item-label">钱包地址:</span>
                  <span className="item-value">{address}</span>
                </div>
                <button className="dropdown-item logout-button" onClick={handleDisconnect}>
                  退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          <WalletOptions buttonStyle="navbar" />
        )}
      </div>
    </nav>
  )
} 