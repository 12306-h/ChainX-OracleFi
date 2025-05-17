from fastapi import APIRouter, HTTPException, Depends
import logging
from typing import Dict, Any

from app.services.market_data import get_all_market_data, get_fear_greed_index, get_market_trend, get_eth_gas_price

router = APIRouter(prefix="/api/market", tags=["market"])
logger = logging.getLogger(__name__)

@router.get("/data")
async def get_market_data() -> Dict[str, Any]:
    """
    获取所有市场数据，包括恐慌与贪婪指数、市场趋势和以太坊GAS费等
    """
    try:
        data = await get_all_market_data()
        return {
            "success": True,
            "data": data,
            "message": "市场数据获取成功"
        }
    except Exception as e:
        logger.error(f"获取市场数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取市场数据失败: {str(e)}")

@router.get("/fear-greed")
async def get_market_fear_greed() -> Dict[str, Any]:
    """
    获取恐慌与贪婪指数数据
    """
    try:
        data = await get_fear_greed_index()
        return {
            "success": True,
            "data": data,
            "message": "恐慌与贪婪指数获取成功"
        }
    except Exception as e:
        logger.error(f"获取恐慌与贪婪指数失败: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "恐慌与贪婪指数获取失败"
        }

@router.get("/trend")
async def get_market_trend_data() -> Dict[str, Any]:
    """
    获取市场趋势数据
    """
    try:
        data = await get_market_trend()
        return {
            "success": True,
            "data": data,
            "message": "市场趋势数据获取成功"
        }
    except Exception as e:
        logger.error(f"获取市场趋势数据失败: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "市场趋势数据获取失败"
        }

@router.get("/gas")
async def get_gas_price() -> Dict[str, Any]:
    """
    获取以太坊GAS费数据
    """
    try:
        data = await get_eth_gas_price()
        return {
            "success": True,
            "data": data,
            "message": "以太坊GAS费数据获取成功"
        }
    except Exception as e:
        logger.error(f"获取以太坊GAS费数据失败: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "以太坊GAS费数据获取失败"
        } 