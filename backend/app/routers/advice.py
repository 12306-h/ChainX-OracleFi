from fastapi import APIRouter, HTTPException, status
import time
from eth_utils import keccak
import json
import logging

from ..schemas.advice import AdviceRequest, ActionResponse, RecommendationData, TradeData, VerifyTransactionResponse
from ..services.ai_model import generate_investment_advice
from ..services.blockchain import record_to_blockchain, create_signature, verify_transaction, get_user_requests
from ..services.ipfs import store_data_to_ipfs, retrieve_data_from_ipfs, check_ipfs_content_availability

router = APIRouter(prefix="/api", tags=["投资建议"])

# 配置日志
logger = logging.getLogger(__name__)

@router.post("/advice", response_model=ActionResponse)
async def get_investment_advice(request: AdviceRequest):
    """
    获取AI投资建议并在区块链上记录存证
    
    处理流程:
    1. 记录请求信息
    2. 调用AI模型生成建议或交易方案
    3. 存储数据到IPFS
    4. 创建签名并上链存证
    5. 返回结果给前端
    """
    try:
        # 简单记录前端传过来的哈希值，不进行验证
        logger.info(f"前端请求哈希: {request.requestHash}")
        logger.info(f"输入数据: {request.input.dict()}")
        
        # 1. 调用AI模型生成建议
        recommendation = await generate_investment_advice(request.input)
        
        # 2. 存储到IPFS
        data_to_store = {
            "input": request.input.dict(),
            "output": recommendation,
            "timestamp": int(time.time())
        }
        
        # 添加元数据
        metadata = {
            "name": f"advice-{request.userAddress[:10]}.json",
            "type": "investment-advice"
        }
        
        # 存储到IPFS并获取CID
        cid = await store_data_to_ipfs(data_to_store, metadata)
        
        # 3. 签名CID
        signature, timestamp = create_signature(cid)
        
        # 4. 上链存证
        tx_hash = await record_to_blockchain(
            request.userAddress, 
            request.requestHash, 
            cid, 
            signature
        )
        
        # 构建响应 - 根据操作类型返回不同格式
        action = recommendation.get("action", "recommend")
        
        if action == "recommend":
            # 投资建议
            return {
                "action": "recommend",
                "success": True,
                "data": {
                    "recommendation": recommendation.get("allocationText", ""),
                    "allocation": recommendation.get("allocation", []),
                    "cid": cid,
                    "txHash": tx_hash,
                    "signature": signature,
                    "timestamp": timestamp
                }
            }
        elif action == "trade":
            # 交易执行
            return {
                "action": "trade",
                "success": True,
                "data": {
                    "tradeSummary": recommendation.get("tradeSummary", ""),
                    "trades": recommendation.get("trades", []),
                    "cid": cid,
                    "txHash": tx_hash,
                    "signature": signature,
                    "timestamp": timestamp
                }
            }
        else:
            # 未知操作类型
            return {
                "action": "unknown",
                "success": False,
                "error": "UNKNOWN_ACTION",
                "message": f"未知的操作类型: {action}"
            }
            
    except HTTPException as e:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        # 记录详细错误并返回通用错误消息
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理请求时出错: {str(e)}"
        )


@router.get("/verify/{tx_hash}", response_model=VerifyTransactionResponse)
async def verify_blockchain_tx(tx_hash: str):
    """
    验证区块链交易并获取详情
    """
    try:
        # 验证交易
        tx_details = await verify_transaction(tx_hash)
        
        return {
            "success": True,
            "data": tx_details
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"验证交易失败: {str(e)}"
        )


@router.get("/ipfs/{cid}")
async def get_ipfs_data(cid: str):
    """
    从IPFS获取数据
    """
    try:
        # 检查CID是否可用
        is_available = await check_ipfs_content_availability(cid)
        if not is_available:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"IPFS内容不可用: {cid}"
            )
        
        # 获取数据
        data = await retrieve_data_from_ipfs(cid)
        
        return {
            "success": True,
            "data": data
        }
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取IPFS数据失败: {str(e)}"
        )


@router.get("/history/{user_address}")
async def get_user_history(user_address: str):
    """
    获取指定用户的历史投资建议记录
    
    Args:
        user_address: 用户的以太坊地址
    
    Returns:
        用户的所有历史记录
    """
    try:
        # 从区块链获取用户历史记录
        user_requests = await get_user_requests(user_address)
        
        return {
            "success": True,
            "data": user_requests
        }
    except Exception as e:
        logger.error(f"获取用户历史记录时出错: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户历史记录失败: {str(e)}"
        ) 