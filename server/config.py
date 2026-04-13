import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / os.getenv("UPLOAD_DIR", "data").split("/")[0]
DB_PATH = BASE_DIR / os.getenv("DB_PATH", "data/agentlab.db")
UPLOAD_DIR = BASE_DIR / os.getenv("UPLOAD_DIR", "data/uploads")

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# LLM
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:27b")

# Server
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# Auth
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "24"))
DEFAULT_ROLE = os.getenv("DEFAULT_ROLE", "estimator")

# Upload
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))

# Telemetry
TELEMETRY_ENABLED = os.getenv("TELEMETRY_ENABLED", "false").lower() == "true"
