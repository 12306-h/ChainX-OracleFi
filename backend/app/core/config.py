import os
from typing import List, Optional


class Settings:
    """应用程序配置"""
    
    def __init__(self):
        # 应用设置
        self.APP_NAME = "去中心化AI投顾系统"
        self.APP_VERSION = "0.1.0"
        self.DEBUG = False
        
        # 服务器设置
        self.HOST = "0.0.0.0"
        self.PORT = 8000
        
        # CORS设置
        self.CORS_ORIGINS = [
            "http://localhost:3000", 
            "http://localhost:5173", 
            "http://127.0.0.1:5173", 
            "http://localhost:8000"
        ]
        
        # 区块链设置
        self.BLOCKCHAIN_RPC_URL = ""
        self.CONTRACT_ADDRESS = "0x950c656375dbeb78a59a498c69df136fc35f9fcc"
        self.PRIVATE_KEY = ""
        self.SERVER_ADDRESS = ""
        self.CHAIN_ID = 11155111
        self.NETWORK_NAME = "sepolia"
        self.CONTRACT_ABI = ""
        
        # IPFS设置
        self.PINATA_API_KEY = None
        self.PINATA_SECRET_KEY = None
        self.PINATA_JWT = None
        self.IPFS_GATEWAY_URL = "https://ipfs.io/ipfs/"
        
        # API密钥设置
        self.INFURA_API_KEY = ""
        
        # DeepSeek API设置
        self.DEEPSEEK_API_KEY = ""
        self.DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
        self.DEEPSEEK_MODEL = "deepseek-chat"
        
        # 日志设置
        self.LOG_LEVEL = "INFO"
        
        # 从环境变量加载配置
        self._load_from_env()
    
    def _load_from_env(self):
        """从环境变量加载配置"""
        # 从.env文件加载到环境变量
        self._load_dotenv()
        
        # 遍历所有属性
        for attr_name in dir(self):
            # 跳过私有属性和方法
            if attr_name.startswith('_') or callable(getattr(self, attr_name)):
                continue
            
            # 从环境变量获取值
            env_value = os.environ.get(attr_name)
            if env_value is not None:
                current_value = getattr(self, attr_name)
                
                # 根据当前值的类型转换环境变量值
                if isinstance(current_value, bool):
                    setattr(self, attr_name, env_value.lower() == "true")
                elif isinstance(current_value, int):
                    setattr(self, attr_name, int(env_value))
                elif isinstance(current_value, list) and attr_name == "CORS_ORIGINS":
                    setattr(self, attr_name, env_value.split(","))
                else:
                    # 特殊处理，移除可能的引号
                    processed_value = env_value
                    if processed_value.startswith('"') and processed_value.endswith('"'):
                        processed_value = processed_value[1:-1]
                    elif processed_value.startswith("'") and processed_value.endswith("'"):
                        processed_value = processed_value[1:-1]
                    setattr(self, attr_name, processed_value)
    
    def _load_dotenv(self):
        """加载.env文件"""
        env_file = ".env"
        if os.path.exists(env_file):
            with open(env_file, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, value = line.split("=", 1)
                        os.environ[key] = value


# 创建全局设置实例
settings = Settings()


# 日志配置
def get_logger_config():
    """
    获取日志配置
    """
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "level": settings.LOG_LEVEL,
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "default",
                "filename": "app.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "level": settings.LOG_LEVEL,
            },
        },
        "root": {
            "handlers": ["console", "file"],
            "level": settings.LOG_LEVEL,
        },
    } 