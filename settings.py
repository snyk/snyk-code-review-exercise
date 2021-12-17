import os

SERVICE_HOST = os.environ.get("SERVICE_HOST", "127.0.0.1")
SERVICE_PORT = int(os.environ.get("SERVICE_PORT", "3000"))
SERVICE_LOG_LEVEL = os.environ.get("SERVICE_LOG_LEVEL", "info")
