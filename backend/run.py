import os
import sys
import json
import builtins
import io

_open_original = open

def _open_utf8(file, mode='r', *args, **kwargs):
    """确保文件以UTF-8编码打开"""
    if 'b' not in mode and kwargs.get('encoding', None) is None:
        kwargs['encoding'] = 'utf-8'
    return _open_original(file, mode, *args, **kwargs)

# 重写内置的open函数
builtins.open = _open_utf8

# 重写json.load以支持utf-8编码
_json_load_original = json.load

def _json_load_utf8(fp, *args, **kwargs):
    """确保json.load使用UTF-8编码"""
    if isinstance(fp, io.TextIOWrapper) and fp.encoding != 'utf-8':
        content = fp.read()
        return json.loads(content, *args, **kwargs)
    return _json_load_original(fp, *args, **kwargs)

json.load = _json_load_utf8

# 设置默认编码
if sys.version_info[0] < 3:
    reload(sys)
    sys.setdefaultencoding('utf-8')

# 导入并运行main模块
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    host = settings.HOST
    # 移除可能的引号
    if host.startswith('"') and host.endswith('"'):
        host = host[1:-1]
    
    print(f"启动服务: {host}:{settings.PORT}")
    uvicorn.run(
        "main:app", 
        host=host, 
        port=settings.PORT, 
        reload=settings.DEBUG
    ) 