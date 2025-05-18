import * as React from 'react'
import { Connector, useConnect } from 'wagmi'
import '../styles/WalletOptions.css'

export function WalletOptions({ buttonStyle = 'default' }: { buttonStyle?: 'default' | 'navbar' }) {
  const { connectors, connect, status, error } = useConnect()
  const [showOptions, setShowOptions] = React.useState(buttonStyle !== 'navbar')

  if (buttonStyle === 'navbar' && !showOptions) {
    return (
      <button 
        className="connect-wallet-button navbar-button"
        onClick={() => setShowOptions(true)}
      >
        连接钱包
      </button>
    )
  }

  return (
    <div className={`wallet-options ${buttonStyle === 'navbar' ? 'navbar-dropdown' : ''}`}>
      {buttonStyle === 'navbar' && (
        <div className="dropdown-header">
          <h3>选择钱包</h3>
          <button className="close-button" onClick={() => setShowOptions(false)}>×</button>
        </div>
      )}
      {buttonStyle !== 'navbar' && <h2>连接钱包</h2>}
      <div className="wallet-buttons">
        {connectors.map((connector) => (
          <WalletOption
            key={connector.uid}
            connector={connector}
            onClick={() => {
              connect({ connector })
              if (buttonStyle === 'navbar') setShowOptions(false)
            }}
          />
        ))}
      </div>
      {status === 'pending' && <p>连接中...</p>}
      {error && <p className="error">{error.message}</p>}
    </div>
  )
}

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
}) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <button className="wallet-button" disabled={!ready} onClick={onClick}>
      {connector.name}
    </button>
  )
} 