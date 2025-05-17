import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from app.core.config import settings
from app.routers import advice, market_data

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("main")

app = FastAPI(
    title=settings.APP_NAME,
    description="基于区块链和IPFS的去中心化AI投资顾问系统",
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# 设置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"全局异常: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "INTERNAL_ERROR", "message": "服务器内部错误"},
    )

# 包含路由
app.include_router(advice.router)
app.include_router(market_data.router)

# 健康检查端点
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}

if __name__ == "__main__":
    logger.info(f"启动服务: {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=settings.DEBUG
    ) 