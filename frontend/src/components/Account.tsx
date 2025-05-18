import { useAccount, useDisconnect } from 'wagmi'

export function Account() {
  const { address, chainId } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div className="account-info">
      <h2>账户信息</h2>
      {address && (
        <>
          <div className="address">
            <strong>地址:</strong> {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </div>
          <div className="chain">
            <strong>当前链 ID:</strong> {chainId}
          </div>
          <button className="disconnect-button" onClick={() => disconnect()}>
            断开连接
          </button>
        </>
      )}
    </div>
  )
} 