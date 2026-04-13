import secrets
import time
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from pydantic import BaseModel
from server.database import get_db
from server.config import SESSION_TTL_HOURS, DEFAULT_ROLE

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory session store: token -> {user_id, username, created_at}
sessions: dict[str, dict] = {}


class LoginRequest(BaseModel):
    username: str


def _clean_expired():
    """Remove expired sessions."""
    now = time.time()
    ttl = SESSION_TTL_HOURS * 3600
    expired = [k for k, v in sessions.items() if now - v["created_at"] > ttl]
    for k in expired:
        del sessions[k]


async def get_current_user(request: Request) -> dict:
    """Dependency: extract and validate session from cookie."""
    token = request.cookies.get("aries_session")
    if not token or token not in sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = sessions[token]
    ttl = SESSION_TTL_HOURS * 3600
    if time.time() - session["created_at"] > ttl:
        del sessions[token]
        raise HTTPException(status_code=401, detail="Session expired")
    return session


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, username, display_name, role FROM users WHERE username = ?",
            (username,),
        )
        row = await cursor.fetchone()

        if row is None:
            # Auto-register
            await db.execute(
                "INSERT INTO users (username, display_name, role, last_login) VALUES (?, ?, ?, datetime('now'))",
                (username, username, DEFAULT_ROLE),
            )
            await db.commit()
            cursor = await db.execute(
                "SELECT id, username, display_name, role FROM users WHERE username = ?",
                (username,),
            )
            row = await cursor.fetchone()
        else:
            await db.execute(
                "UPDATE users SET last_login = datetime('now') WHERE id = ?",
                (row["id"],),
            )
            await db.commit()

    token = secrets.token_hex(32)
    session_data = {
        "user_id": row["id"],
        "username": row["username"],
        "display_name": row["display_name"],
        "role": row["role"],
        "created_at": time.time(),
    }
    sessions[token] = session_data

    _clean_expired()

    response.set_cookie(
        key="aries_session",
        value=token,
        httponly=True,
        max_age=SESSION_TTL_HOURS * 3600,
        samesite="lax",
    )
    return {
        "user_id": session_data["user_id"],
        "username": session_data["username"],
        "display_name": session_data["display_name"],
        "role": session_data["role"],
    }


@router.post("/logout")
async def logout(response: Response, request: Request):
    token = request.cookies.get("aries_session")
    if token and token in sessions:
        del sessions[token]
    response.delete_cookie("aries_session")
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "display_name": user["display_name"],
        "role": user["role"],
    }
