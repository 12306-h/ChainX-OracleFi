# 去中心化AI投顾系统 - 后端

本项目是一个去中心化AI投资顾问系统的后端部分，结合了AI模型推理、IPFS分布式存储和区块链存证功能。

## 系统架构

### 数据存储
- IPFS存储: 分布式存储用户输入和AI建议
- 区块链存证: 在链上记录数据哈希和IPFS CID

### 处理节点
- 前端: React + ethers.js
- 后端: Python FastAPI

### 数据流向
1. 前端 -> 后端: 用户输入JSON + Keccak256哈希
2. 后端 -> AI模型: 预处理输入
3. AI模型 -> 后端: 生成建议
4. 后端 -> IPFS: 保存完整记录
5. 后端 -> 区块链: 上链存证
6. 区块链 -> 前端: 交易回执
7. IPFS -> 前端: 原始数据

## 技术栈

- Python 3.8+
- FastAPI: 构建高性能API
- Web3.py: 与区块链交互
- IPFS/Web3.Storage: 分布式存储

## 项目结构

```
backend/
│
├── app/                    # 主应用目录
│   ├── core/               # 核心配置
│   ├── models/             # 数据库模型
│   ├── routers/            # API路由
│   ├── schemas/            # 数据模型/验证
│   ├── services/           # 业务逻辑服务
│   ├── static/             # 静态文件
│   └── utils/              # 工具函数
│
├── contracts/              # 智能合约
│
├── tests/                  # 测试
│
├── .env.example            # 环境变量示例
├── main.py                 # 应用入口
└── requirements.txt        # 依赖项
```

## 安装与运行

1. 克隆仓库
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. 创建虚拟环境
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

3. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量
   ```bash
   cp .env.example .env
   # 编辑.env文件，填写实际的配置值
   ```

5. 运行应用
   ```bash
   python main.py
   ```

## API接口

### 获取投资建议

- **URL**: `/api/advice`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "input": {
      "riskLevel": "high",
      "amount": 10000,
      "horizon": 3,
      "assets": ["crypto", "stocks"]
    },
    "requestHash": "0x5fe50b...（前端生成的keccak256哈希）"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "recommendation": "60% BTC, 30% ETH, 10% USDC",
      "cid": "bafybeid...",
      "txHash": "0x3a9f8c...",
      "signature": "0x12a4fb..."
    }
  }
  ```

## 区块链集成

系统使用智能合约记录用户请求和AI建议的哈希证明：

- 合约方法: `recordRequest(address user, bytes32 requestHash, string cid, bytes signature)`
- 事件: `RequestRecorded(address user, bytes32 requestHash, string cid, uint256 timestamp)`

## IPFS数据格式

存储在IPFS上的完整记录格式：

```json
{
  "input": { /* 原始用户输入 */ },
  "output": {
    "modelVersion": "v1.0.0",
    "timestamp": 1712345678,
    "allocation": [
      { "asset": "BTC", "percentage": 60 },
      { "asset": "ETH", "percentage": 30 }
    ]
  }
}
```

## 安全考虑

- 所有链上数据经过签名验证
- 敏感数据可使用用户的公钥加密
- 模型输出被固定在IPFS上，确保不变性
- 请求哈希在前端生成，确保数据完整性

