import aiohttp
import asyncio
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from ..core.config import settings

# 配置日志
logger = logging.getLogger(__name__)

async def get_fear_greed_index() -> Dict[str, Any]:
    """
    获取恐慌与贪婪指数
    返回示例: {"value": 65, "value_classification": "Greed", "timestamp": "2023-06-01T12:00:00Z"}
    """
    url = "https://api.alternative.me/fng/"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    logger.warning(f"获取恐慌与贪婪指数失败，状态码: {response.status}")
                    return {"value": 50, "value_classification": "Neutral", "timestamp": datetime.now().isoformat()}
                
                data = await response.json()
                if not data.get("data") or len(data["data"]) == 0:
                    logger.warning("恐慌与贪婪指数API返回空数据")
                    return {"value": 50, "value_classification": "Neutral", "timestamp": datetime.now().isoformat()}
                
                # 提取今天的恐慌与贪婪指数
                today_data = data["data"][0]
                return {
                    "value": int(today_data["value"]),
                    "value_classification": today_data["value_classification"],
                    "timestamp": datetime.now().isoformat()
                }
    except Exception as e:
        logger.warning(f"获取恐慌与贪婪指数时出错: {str(e)}")
        return {"value": 50, "value_classification": "Neutral", "timestamp": datetime.now().isoformat()}

async def get_market_trend() -> Dict[str, Any]:
    """
    根据恐慌与贪婪指数确定市场趋势方向
    返回示例: {"trend": "看涨", "description": "市场处于贪婪状态，投资者情绪偏向乐观", "timestamp": "2023-06-01T12:00:00Z"}
    """
    try:
        fear_greed = await get_fear_greed_index()
        value = fear_greed.get("value", 50)
        
        if value >= 70:
            trend = "看涨"
            description = "市场处于极度贪婪状态，投资者过度乐观，可能是卖出信号"
        elif 55 <= value < 70:
            trend = "看涨"
            description = "市场处于贪婪状态，投资者情绪偏向乐观"
        elif 45 <= value < 55:
            trend = "盘整"
            description = "市场情绪中性，未显示明确方向"
        elif 30 <= value < 45:
            trend = "看跌"
            description = "市场处于恐慌状态，投资者情绪偏向悲观"
        else:
            trend = "看跌"
            description = "市场处于极度恐慌状态，投资者过度悲观，可能是买入信号"
        
        return {
            "trend": trend,
            "description": description,
            "fear_greed_value": value,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.warning(f"计算市场趋势时出错: {str(e)}")
        return {
            "trend": "盘整",
            "description": "无法确定市场趋势，采用中性判断",
            "fear_greed_value": 50,
            "timestamp": datetime.now().isoformat()
        }

async def get_eth_gas_price() -> Dict[str, Any]:
    """
    获取以太坊GAS费
    返回示例: {"low": 20, "average": 35, "high": 50, "timestamp": "2023-06-01T12:00:00Z"}
    """
    try:
        # 使用Infura API获取GAS费用
        infura_api_key = settings.INFURA_API_KEY if hasattr(settings, "INFURA_API_KEY") else ""
        if not infura_api_key:
            logger.warning("Infura API密钥未配置")
            return {}
            
        chain_id = 1  # 以太坊主网
        url = f"https://gas.api.infura.io/v3/{infura_api_key}/networks/{chain_id}/suggestedGasFees"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    logger.warning(f"获取以太坊GAS费失败，状态码: {response.status}")
                    return {}
                
                data = await response.json()
                
                # 从新API格式中提取数据，转换为我们需要的格式
                # suggestedMaxFeePerGas值是以ETH为单位，需要转换为Gwei (1 ETH = 10^9 Gwei)
                try:
                    # 提取suggestedMaxFeePerGas并转换为Gwei
                    low = round(float(data.get("low", {}).get("suggestedMaxFeePerGas", 0)) * 1e9)
                    medium = round(float(data.get("medium", {}).get("suggestedMaxFeePerGas", 0)) * 1e9)
                    high = round(float(data.get("high", {}).get("suggestedMaxFeePerGas", 0)) * 1e9)
                    
                    return {
                        "low": low,
                        "average": medium,
                        "high": high,
                        "timestamp": datetime.now().isoformat()
                    }
                except (ValueError, TypeError) as e:
                    logger.warning(f"解析Infura Gas API数据时出错: {str(e)}")
                    return {}
    except Exception as e:
        logger.warning(f"获取以太坊GAS费时出错: {str(e)}")
        return {}

async def get_all_market_data() -> Dict[str, Any]:
    """
    获取所有市场数据
    """
    try:
        # 并发获取所有市场数据
        tasks = [
            get_fear_greed_index(),
            get_market_trend(),
            get_eth_gas_price()
        ]
        
        results = await asyncio.gather(*tasks)
        
        # 整合所有数据
        return {
            "fear_greed_index": results[0],
            "market_trend": results[1],
            "eth_gas_price": results[2],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"获取市场数据时出错: {str(e)}")
        # 返回完整的空数据结构
        return {
            "fear_greed_index": {},
            "market_trend": {},
            "eth_gas_price": {},
            "timestamp": datetime.now().isoformat()
        }