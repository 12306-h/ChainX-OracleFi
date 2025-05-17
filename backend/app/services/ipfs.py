import os
import json
import logging
import aiohttp
import asyncio
from typing import Dict, Any, Union, Optional
from ..core.config import settings

# 配置日志
logger = logging.getLogger(__name__)

# 从配置获取环境变量
PINATA_API_KEY = settings.PINATA_API_KEY
PINATA_SECRET_KEY = settings.PINATA_SECRET_KEY
PINATA_JWT = settings.PINATA_JWT
IPFS_GATEWAY_URL = settings.IPFS_GATEWAY_URL

# Pinata API 接口
PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
PINATA_PIN_BY_HASH_URL = "https://api.pinata.cloud/pinning/pinByHash"

async def store_data_to_ipfs(data: Dict[str, Any], metadata: Optional[Dict[str, str]] = None) -> str:
    """
    将数据存储到IPFS并返回CID
    
    Args:
        data: 要存储的数据字典
        metadata: 可选的元数据，用于描述内容
    
    Returns:
        str: IPFS内容标识符(CID)
    """
    try:
        # 检查Pinata凭证
        if not PINATA_API_KEY and not PINATA_JWT:
            logger.error("Pinata API凭证未配置")
            raise ValueError("Pinata API凭证未配置")
        
        # 准备请求头
        headers = {
            "Content-Type": "application/json"
        }
        
        # 使用JWT token如果存在
        if PINATA_JWT:
            headers["Authorization"] = f"Bearer {PINATA_JWT}"
        else:
            # 回退到使用API密钥
            headers["pinata_api_key"] = PINATA_API_KEY
            headers["pinata_secret_api_key"] = PINATA_SECRET_KEY
        
        # 准备请求体
        pinata_metadata = {
            "name": metadata.get("name", "ai-advice.json") if metadata else "ai-advice.json"
        }
        
        if metadata and "type" in metadata:
            pinata_metadata["keyvalues"] = {"type": metadata["type"]}
        
        request_body = {
            "pinataContent": data,
            "pinataMetadata": pinata_metadata
        }
        
        # 发送请求到Pinata
        async with aiohttp.ClientSession() as session:
            async with session.post(PINATA_PIN_JSON_URL, json=request_body, headers=headers) as response:
                if response.status not in (200, 201):
                    error_text = await response.text()
                    logger.error(f"Pinata存储请求失败: {error_text}")
                    raise Exception(f"Pinata存储请求失败: {response.status}")
                
                # 解析响应
                response_data = await response.json()
                cid = response_data.get("IpfsHash")
                
                if not cid:
                    raise ValueError("从Pinata响应中未获取到CID")
                
                logger.info(f"数据已成功存储到IPFS，CID: {cid}")
                
                return cid
    except Exception as e:
        logger.error(f"存储数据到IPFS时出错: {str(e)}")
        raise


async def retrieve_data_from_ipfs(cid: str, is_binary: bool = False) -> Union[Dict[str, Any], bytes]:
    """
    从IPFS检索数据
    
    Args:
        cid: IPFS内容标识符
        is_binary: 是否返回二进制数据(用于模型文件等)
    
    Returns:
        Dict或bytes: 检索到的数据，根据is_binary参数返回不同类型
    """
    try:
        # 构建URL
        url = f"{IPFS_GATEWAY_URL}{cid}"
        
        # 发送请求
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"从IPFS检索数据失败: {error_text}")
                    raise Exception(f"从IPFS检索数据失败: {response.status}")
                
                # 根据参数决定返回格式
                if is_binary:
                    return await response.read()
                else:
                    return await response.json()
    except Exception as e:
        logger.error(f"从IPFS检索数据时出错: {str(e)}")
        raise


async def pin_to_ipfs(cid: str) -> bool:
    """
    确保数据在IPFS上被固定
    
    Args:
        cid: 要固定的内容的CID
    
    Returns:
        bool: 固定操作是否成功
    """
    # 对于Pinata，直接上传已经固定了内容
    # 这个函数保留是为了兼容性，以及未来可能添加其他固定服务
    logger.info(f"CID已通过Pinata固定: {cid}")
    return True


async def check_ipfs_content_availability(cid: str, timeout: int = 5) -> bool:
    """
    检查IPFS内容是否可用
    
    Args:
        cid: 要检查的CID
        timeout: 超时时间(秒)
    
    Returns:
        bool: 内容是否可用
    """
    try:
        # 构建URL
        url = f"{IPFS_GATEWAY_URL}{cid}"
        
        # 发送HEAD请求检查可用性
        async with aiohttp.ClientSession() as session:
            async with session.head(url, timeout=timeout) as response:
                return response.status == 200
    except asyncio.TimeoutError:
        logger.warning(f"检查CID超时: {cid}")
        return False
    except Exception as e:
        logger.error(f"检查CID可用性时出错: {str(e)}")
        return False 