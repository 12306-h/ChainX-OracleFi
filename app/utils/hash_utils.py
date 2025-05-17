import json
import hashlib
from eth_utils import keccak


def generate_hash(data):
    """
    生成数据的Keccak256哈希
    
    Args:
        data: 要哈希的数据
    
    Returns:
        str: 十六进制哈希字符串
    """
    # 将数据转换为JSON字符串
    json_str = json.dumps(data, sort_keys=True)
    
    # 使用eth_utils的keccak函数计算哈希
    hash_bytes = keccak(text=json_str)
    
    # 返回十六进制哈希
    return '0x' + hash_bytes.hex()


def verify_hash(data, expected_hash):
    """
    验证数据的哈希是否匹配预期哈希
    
    Args:
        data: 原始数据
        expected_hash: 预期的哈希字符串
    
    Returns:
        bool: 哈希是否匹配
    """
    # 计算数据的哈希
    calculated_hash = generate_hash(data)
    
    # 标准化哈希格式
    if not expected_hash.startswith('0x'):
        expected_hash = '0x' + expected_hash
    
    # 比较哈希
    return calculated_hash.lower() == expected_hash.lower()


def sha256_hash(data):
    """
    计算数据的SHA256哈希
    
    Args:
        data: 要哈希的数据
    
    Returns:
        str: 十六进制哈希字符串
    """
    # 将数据转换为JSON字符串
    if not isinstance(data, (str, bytes)):
        data = json.dumps(data, sort_keys=True)
    
    # 确保数据是字节类型
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    # 计算SHA256哈希
    hash_obj = hashlib.sha256(data)
    
    # 返回十六进制哈希
    return hash_obj.hexdigest() 