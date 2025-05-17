from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class CryptoAsset(BaseModel):
    symbol: str = Field(..., description="加密货币符号，例如BTC, ETH, USDC等")
    percentage: float = Field(..., description="用户当前持有该加密货币的比例 (0-100)")
    chain: str = Field(default="ethereum", description="资产所在的区块链网络，例如ethereum, bsc, polygon等")
    amount: float = Field(default=0, description="用户持有的实际数量")
    price: Optional[float] = Field(None, description="当前资产单价(USD)")


class InputData(BaseModel):
    riskLevel: str = Field(..., description="风险等级: low, medium, high")
    totalValue: float = Field(..., description="用户加密资产总价值(USD)", alias="amount")
    cryptoAssets: List[CryptoAsset] = Field(..., description="用户当前持有的加密货币资产详情")
    userMessage: Optional[str] = Field(None, description="用户的其他需求描述或投资偏好")
    
    class Config:
        populate_by_name = True  # 允许使用别名填充字段


class AllocationItem(BaseModel):
    asset: str = Field(..., description="资产名称")
    percentage: int = Field(..., description="配置百分比")


class TradeItem(BaseModel):
    fromAsset: str = Field(..., description="源资产名称")
    fromChain: str = Field(default="ethereum", description="源资产所在的区块链网络")
    toAsset: str = Field(..., description="目标资产名称")
    toChain: str = Field(default="ethereum", description="目标资产所在的区块链网络")
    amount: float = Field(..., description="交易数量")
    amountInUSD: Optional[float] = Field(None, description="交易金额(USD)")
    reason: Optional[str] = Field(None, description="交易原因简述")


class AdviceRequest(BaseModel):
    userAddress: str = Field(..., description="用户钱包地址")
    input: InputData = Field(..., description="用户输入参数")
    requestHash: str = Field(..., description="通过keccak256哈希计算的请求内容哈希")


class RecommendationData(BaseModel):
    recommendation: str = Field(..., description="文本形式的建议")
    allocation: List[AllocationItem] = Field(..., description="资产配置详情")
    cid: str = Field(..., description="IPFS内容标识符")
    txHash: str = Field(..., description="区块链交易哈希")
    signature: str = Field(..., description="后端对CID的签名")
    timestamp: int = Field(..., description="签名时间戳")


class TradeData(BaseModel):
    tradeSummary: str = Field(..., description="交易方案总结")
    trades: List[TradeItem] = Field(..., description="交易详情")
    cid: str = Field(..., description="IPFS内容标识符")
    txHash: str = Field(..., description="区块链交易哈希")
    signature: str = Field(..., description="后端对CID的签名")
    timestamp: int = Field(..., description="签名时间戳")


class ActionResponse(BaseModel):
    action: str = Field(..., description="动作类型：recommend或trade")
    success: bool = Field(..., description="请求是否成功")
    data: Optional[Dict[str, Any]] = Field(None, description="成功时返回的数据")
    error: Optional[str] = Field(None, description="错误代码")
    message: Optional[str] = Field(None, description="错误信息")


class AdviceResponse(BaseModel):
    success: bool = Field(..., description="请求是否成功")
    data: Optional[RecommendationData] = Field(None, description="成功时返回的数据")
    error: Optional[str] = Field(None, description="错误代码")
    message: Optional[str] = Field(None, description="错误信息")


class BlockchainEvent(BaseModel):
    """区块链事件数据模型"""
    event: str = Field(..., description="事件名称")
    address: str = Field(..., description="合约地址")
    returnValues: Dict[str, Any] = Field(..., description="事件返回值")
    blockNumber: int = Field(..., description="区块号")
    
    # 设置模型配置，允许额外的字段
    class Config:
        extra = "ignore"  # 忽略额外的字段，允许更灵活的数据结构


class TransactionData(BaseModel):
    """交易数据模型"""
    hash: str = Field(..., description="交易哈希")
    blockNumber: int = Field(..., description="区块号")
    from_address: str = Field(..., alias="from", description="发送方地址")
    to: str = Field(..., description="接收方地址")
    status: str = Field(..., description="交易状态")
    gasUsed: int = Field(..., description="使用的gas量")
    events: List[BlockchainEvent] = Field(default=[], description="交易事件")
    
    class Config:
        extra = "ignore"  # 忽略额外的字段
        populate_by_name = True  # 允许使用别名填充字段


class VerifyTransactionResponse(BaseModel):
    """交易验证响应"""
    success: bool = Field(..., description="请求是否成功")
    data: Optional[TransactionData] = Field(None, description="交易详情")
    error: Optional[str] = Field(None, description="错误信息")
    
    class Config:
        extra = "ignore"  # 忽略额外的字段


class IPFSResponse(BaseModel):
    success: bool = Field(..., description="请求是否成功")
    data: Optional[Dict[str, Any]] = Field(None, description="IPFS数据")
    error: Optional[str] = Field(None, description="错误信息") 