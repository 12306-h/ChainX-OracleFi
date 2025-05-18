import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import './styles/App.css'
import './styles/Navigation.css'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { WalletOptions } from './components/WalletOptions'
import { TokenBalances } from './components/TokenBalances'
import { AIAdvisorContract } from './components/AIAdvisorContract'
import { updateAllTokenPrices } from './config/tokens'

function App() {
  const { isConnected } = useAccount()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'assets' | 'history'>('assets')
  
  // 当钱包断开连接时，自动关闭侧边栏
  useEffect(() => {
    if (!isConnected) {
      setSidebarOpen(false);
    }
  }, [isConnected]);

  // 初始化和定期更新代币价格
  useEffect(() => {
    // 应用加载时立即更新一次价格
    const fetchInitialPrices = async () => {
      await updateAllTokenPrices();
      console.log('价格数据初始化完成');
    };
    
    fetchInitialPrices();
    
    // 设置定时器，每30秒更新一次价格
    const priceUpdateInterval = setInterval(async () => {
      await updateAllTokenPrices();
      console.log('价格数据已更新');
    }, 30 * 1000); // 30秒
    
    // 清理定时器
    return () => clearInterval(priceUpdateInterval);
  }, []);

  // 侧边栏切换函数，只有在连接钱包后才能打开
  const handleToggleSidebar = () => {
    if (isConnected) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Navbar />
      
      <div className="main-container" style={{
        background: 'linear-gradient(135deg, #2a0329 0%, #1a0040 50%, #0d001a 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 0,
        }}></div>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(89, 0, 255, 0.2) 0%, rgba(41, 3, 41, 0) 70%)',
          filter: 'blur(30px)',
          animation: 'pulse 8s ease-in-out infinite',
          zIndex: 0,
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '20%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, rgba(72, 0, 142, 0.2) 0%, rgba(26, 0, 64, 0) 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 6s ease-in-out infinite',
          animationDelay: '2s',
          zIndex: 0,
        }}></div>
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.2); opacity: 0.8; }
              100% { transform: scale(1); opacity: 0.5; }
            }
          `}
        </style>
        <main className="content" style={{ position: 'relative', zIndex: 1 }}>
          {!isConnected ? (
            <div className="connect-section">
              <div className="book-animation">
                <div className="book">
                  <div className="book-cover">
                    <div className="book-spine"></div>
                    <div className="book-front">OracleFi</div>
                  </div>
                  <div className="book-page"></div>
                  <div className="book-page"></div>
                  <div className="book-page"></div>
                  <div className="book-page"></div>
                  <div className="book-page"></div>
                </div>
              </div>
              <h2>欢迎使用AI投资助手</h2>
              <p>连接您的钱包以查看您在不同区块链上的资产分布和获取AI投资建议</p>
              <WalletOptions />
            </div>
          ) : (
            <div className="dashboard-section">
              <div className="dashboard-tabs">
                <div className="tab-item" style={{ marginRight: '15rem' }}>
                  <button 
                    className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assets')}
                  >
                    资产概览
                  </button>
                  <div className={`progress-bar ${activeTab === 'assets' ? 'active' : ''}`}></div>
                </div>
                <div className="tab-item">
                  <button 
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    投资建议历史
                  </button>
                  <div className={`progress-bar ${activeTab === 'history' ? 'active' : ''}`}></div>
                </div>
              </div>
              
              <div className="tab-content" style={{
                position: 'relative',
                background: 'rgba(147, 112, 219, 0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '24px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
                transform: 'translateZ(0)',
                animation: 'float 6s ease-in-out infinite',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '5%',
                  width: '90%',
                  height: '90%',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  filter: 'blur(10px)',
                  borderRadius: '16px',
                  zIndex: 0,
                }}></div>
                {activeTab === 'assets' ? (
                  <div style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '20px',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)',
                    zIndex: 1,
                  }}>
                    <TokenBalances />
                  </div>
                ) : (
                  <div style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '20px',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)',
                    zIndex: 1,
                  }}>
                    <AIAdvisorContract />
                  </div>
                )}
                <style>
                  {`
                    @keyframes float {
                      0% { transform: translateY(0px); }
                      50% { transform: translateY(-10px); }
                      100% { transform: translateY(0px); }
                    }
                  `}
                </style>
              </div>
            </div>
          )}
        </main>
        
        <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />
      </div>
      
      <footer className="footer">
        <p>ChainX &copy; {new Date().getFullYear()} | 数据仅供参考，不构成投资建议</p>
      </footer>
    </div>
  )
}

export default App
