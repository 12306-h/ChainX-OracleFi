import logging
import time
import json
import aiohttp
from typing import Dict, Any, List
from ..schemas.advice import InputData
from ..core.config import settings
from .market_data import get_all_market_data

# 配置日志
logger = logging.getLogger(__name__)

# 从配置获取DeepSeek API信息
DEEPSEEK_API_KEY = settings.DEEPSEEK_API_KEY
DEEPSEEK_API_URL = settings.DEEPSEEK_API_URL
DEEPSEEK_MODEL = settings.DEEPSEEK_MODEL


async def generate_investment_advice(input_data: InputData) -> Dict[str, Any]:
    """
    使用DeepSeek API生成投资建议
    
    Args:
        input_data: 用户输入数据
        
    Returns:
        Dict: 包含资产配置的投资建议
    """
    try:
        if not DEEPSEEK_API_KEY:
            logger.error("DeepSeek API密钥未配置")
            raise ValueError("DeepSeek API密钥未配置")
        
        # 获取市场数据
        market_data = await get_all_market_data()
        
        # 构建提示词
        system_prompt = """
        你是一个专业的投资顾问和交易执行Agent，根据用户提供的风险偏好、资产总价值、当前加密货币资产分布和最新市场数据提供投资建议，并可以执行资产交换操作。
        
        你需要根据用户需求提供以下两种功能：
        
        1. 投资建议：给出具体的加密货币资产配置比例，包括主流加密货币和稳定币。
        2. 交易执行：根据用户要求帮助规划资产间的交易操作。
        
        请根据用户的输入内容判断他们需要的是哪种功能，然后按照对应格式输出(如果用户没有明确提出交易需求，则默认提供投资建议)：
        
        对于投资建议，请按照以下JSON格式输出：
        {
            "action": "recommend",
            "allocation": [
                {"asset": "资产名称", "percentage": 百分比, "chain": "区块链网络"},
                ...
            ],
            "allocationText": "总结性的资产配置描述文本"
        }
        
        对于交易执行请求，请按照以下JSON格式输出：
        {
            "action": "trade",
            "trades": [
                {
                    "fromAsset": "源资产名称",
                    "fromChain": "源资产所在链",
                    "toAsset": "目标资产名称",
                    "toChain": "目标资产所在链",
                    "amount": 交易数量,
                    "amountInUSD": 美元价值,
                    "reason": "交易原因简述"
                },
                ...
            ],
            "tradeSummary": "交易方案总结"
        }
        
        注意：
        1. 所有资产配置比例总和必须为100%
        2. 交易指令必须明确指定源资产、目标资产、所在区块链网络和具体交易数量
        3. 根据市场情况和用户提供的风险偏好提供合理的建议
        4. 提供的交易计划应考虑当前市场情况和Gas费用
        5. 明确区分不同链上的同名资产(例如以太坊上的USDC和Polygon上的USDC)
        """
        
        # 格式化当前加密货币资产分布
        crypto_assets_text = ""
        for asset in input_data.cryptoAssets:
            asset_line = f"- {asset.symbol}: {asset.percentage}% (链: {asset.chain}"
            if asset.amount:
                asset_line += f", 数量: {asset.amount}"
            if asset.price:
                asset_line += f", 单价: ${asset.price}"
            asset_line += ")\n"
            crypto_assets_text += asset_line
        
        # 格式化市场数据
        fear_greed = market_data.get("fear_greed_index", {})
        market_trend = market_data.get("market_trend", {})
        gas_price = market_data.get("eth_gas_price", {})
        
        market_data_text = f"""
        市场情绪指数: {fear_greed.get('value', 50)} ({fear_greed.get('value_classification', 'Neutral')})
        市场趋势: {market_trend.get('trend', '盘整')} - {market_trend.get('description', '无法确定市场趋势')}
        以太坊GAS费: 低: {gas_price.get('low', 0)} Gwei, 平均: {gas_price.get('average', 0)} Gwei, 高: {gas_price.get('high', 0)} Gwei
        """
        
        # 构建用户消息
        user_message = f"""
        请根据以下投资者信息和最新市场数据提供加密货币资产配置建议：
        风险偏好：{input_data.riskLevel}（low=保守, medium=中等, high=激进）
        资产总价值：${input_data.totalValue}
        
        当前加密货币资产分布：
        {crypto_assets_text}
        
        最新市场数据：
        {market_data_text}
        """
        
        # 添加用户的具体需求描述（如果有）
        if hasattr(input_data, 'userMessage') and input_data.userMessage:
            user_message += f"""
        投资者额外需求：
        {input_data.userMessage}
        """
            
        user_message += """
        我希望获得一个具体的加密货币投资组合方案，包括不同资产的配置比例，并请注明推荐的区块链网络。
        请根据我当前的资产分布、风险偏好和个人需求，提供更加合理的配置建议。
        """
        
        # 构建DeepSeek API请求
        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.3,  # 较低的温度以获得更确定的结果
            "max_tokens": 1000
        }
        
        # 请求头
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
        }
        
        # 发送请求到DeepSeek API
        async with aiohttp.ClientSession() as session:
            async with session.post(DEEPSEEK_API_URL, json=payload, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"DeepSeek API请求失败: {error_text}")
                    raise Exception(f"DeepSeek API请求失败: {response.status}")
                
                # 解析API响应
                response_data = await response.json()
                
                # 提取AI生成的内容
                ai_response = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info(f"DeepSeek API返回: {ai_response[:100]}...")
                
                # 从响应中提取JSON
                try:
                    # 提取JSON部分，如果有多个JSON块，则选取第一个
                    json_start = ai_response.find('{')
                    json_end = ai_response.rfind('}') + 1
                    
                    if json_start >= 0 and json_end > json_start:
                        json_str = ai_response[json_start:json_end]
                        ai_data = json.loads(json_str)
                    else:
                        # 如果没有找到JSON格式，尝试解析整个文本
                        ai_data = json.loads(ai_response)
                    
                    # 根据action字段判断是投资建议还是交易执行
                    action = ai_data.get("action", "recommend")  # 默认为投资建议
                    
                    if action == "recommend":
                        # 处理投资建议
                        # 确保正确的结构
                        if "allocation" not in ai_data or "allocationText" not in ai_data:
                            raise ValueError("API返回的投资建议数据格式不正确")
                        
                        # 处理分配数据，确保百分比总和为100%
                        allocation = ai_data["allocation"]
                        
                        # 确保每个分配项都有chain字段
                        for item in allocation:
                            if "chain" not in item:
                                item["chain"] = "ethereum"  # 默认使用以太坊网络
                        
                        total = sum(item["percentage"] for item in allocation)
                        
                        # 如果百分比总和不为100%，进行调整
                        if total != 100:
                            logger.warning(f"资产配置百分比总和为{total}%，调整为100%")
                            scale_factor = 100 / total
                            for item in allocation:
                                item["percentage"] = round(item["percentage"] * scale_factor)
                            
                            # 确保调整后总和为100%
                            current_sum = sum(item["percentage"] for item in allocation)
                            if current_sum != 100:
                                # 加到第一个资产上
                                allocation[0]["percentage"] += (100 - current_sum)
                        
                        return {
                            "modelVersion": f"deepseek-api-{DEEPSEEK_MODEL}",
                            "timestamp": int(time.time()),
                            "action": "recommend",
                            "allocation": allocation,
                            "allocationText": ai_data["allocationText"],
                            "market_data": market_data  # 添加市场数据到返回中，用于IPFS存储
                        }
                    
                    elif action == "trade":
                        # 处理交易执行请求
                        if "trades" not in ai_data or "tradeSummary" not in ai_data:
                            raise ValueError("API返回的交易执行数据格式不正确")
                        
                        # 验证交易数据
                        trades = ai_data["trades"]
                        for trade in trades:
                            if "fromAsset" not in trade or "toAsset" not in trade or "amount" not in trade:
                                raise ValueError("交易数据缺少必要字段")
                            
                            # 确保每个交易有链信息
                            if "fromChain" not in trade:
                                trade["fromChain"] = "ethereum"
                            if "toChain" not in trade:
                                trade["toChain"] = "ethereum"
                        
                        return {
                            "modelVersion": f"deepseek-api-{DEEPSEEK_MODEL}",
                            "timestamp": int(time.time()),
                            "action": "trade",
                            "trades": trades,
                            "tradeSummary": ai_data["tradeSummary"],
                            "market_data": market_data
                        }
                    else:
                        raise ValueError(f"未知的操作类型: {action}")
                    
                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(f"解析DeepSeek API响应失败: {str(e)}")
                    raise ValueError(f"无法从DeepSeek API响应中提取有效的JSON: {str(e)}")
                    
    except Exception as e:
        logger.error(f"生成投资建议时出错: {str(e)}")
        # 提供后备建议，并记录错误
        return {
            "modelVersion": "fallback",
            "timestamp": int(time.time()),
            "action": "recommend",  # 默认提供建议而不是交易
            "error": str(e),
            "allocation": [
                {"asset": "USDC", "percentage": 50, "chain": "ethereum"},
                {"asset": "BTC", "percentage": 20, "chain": "ethereum"},
                {"asset": "ETH", "percentage": 15, "chain": "ethereum"},
                {"asset": "USDT", "percentage": 15, "chain": "ethereum"}
            ],
            "allocationText": "由于处理请求时出错，提供安全配置：50% USDC, 20% BTC, 15% ETH, 15% USDT",
            "market_data": await get_all_market_data()  
        } 