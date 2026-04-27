import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

port = int(os.getenv("PORT", "8005"))
host = os.getenv("HOST", "0.0.0.0")

uvicorn.run("server.app:app", host=host, port=port, reload=False)
