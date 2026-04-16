from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from server.database import init_db
from server.routes.auth import router as auth_router
from server.routes.config_routes import router as config_router
from server.routes.chat import router as chat_router
from server.routes.estimates import router as estimates_router
from server.routes.pipelines import router as pipelines_router
from server.routes.agents import router as agents_router
from server.routes.memories import router as memories_router

STATIC_DIR = Path(__file__).resolve().parent.parent / "static" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Scoper", version="2.0.0", lifespan=lifespan)

# CORS — allow all for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(config_router)
app.include_router(chat_router)
app.include_router(estimates_router)
app.include_router(pipelines_router)
app.include_router(agents_router)
app.include_router(memories_router)

# Static files
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets") if (STATIC_DIR / "assets").exists() else None
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# SPA catch-all — serve index.html for non-API paths
@app.get("/{full_path:path}")
async def spa_catch_all(request: Request, full_path: str):
    # Don't catch API routes
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    # Serve actual static files if they exist
    static_file = STATIC_DIR / full_path
    if full_path and static_file.exists() and static_file.is_file():
        return FileResponse(str(static_file))

    # Fall back to index.html for SPA routing
    index = STATIC_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))

    return JSONResponse(
        status_code=200,
        content={"message": "Scoper — Frontend not built yet. API is running."},
    )
