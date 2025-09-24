from fastapi import FastAPI, HTTPException, Depends, status, Header, Query, Path
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html, get_swagger_ui_oauth2_redirect_html
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional, Tuple
import os, base64, bcrypt, hmac, hashlib, secrets, json, ast
import psycopg2  # noqa: F401  (установлен, нужен драйвер)
from psycopg2.pool import SimpleConnectionPool
from config import *

OPENAPI_TAGS = [
    {"name": "1. Auth", "description": "Логин и получение Bearer-токена."},
    {"name": "2. Objects", "description": "Создание и получение объектов (локаций)."},
    {"name": "3. Devices", "description": "Создание и получение устройств."},
    {"name": "4. Transfer", "description": "Перенос устройства между объектами; запись в историю."},
    {"name": "5. Search", "description": "Поиск по объектам и устройствам + глобальные счётчики."},
    {"name": "6. Stats", "description": "Сводная статистика."},
]

# =========================
# APP
# =========================
app = FastAPI(
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    openapi_tags=OPENAPI_TAGS
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBasic()

def get_uzbek_time_iso():
    uz_tz = timezone(timedelta(hours=5))
    return datetime.now(uz_tz).isoformat(sep=' ', timespec='seconds')

# =========================
# PROTECT /docs & /openapi.json (Basic Auth)
# =========================
def _check_docs_auth(credentials: HTTPBasicCredentials = Depends(security)):
    if not (secrets.compare_digest(credentials.username, DOCS_USERNAME) and
            secrets.compare_digest(credentials.password, DOCS_PASSWORD)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )

@app.get("/docs", include_in_schema=False)
def protected_swagger_ui(_: None = Depends(_check_docs_auth)):
    swagger_ui_parameters = {
        "tagsSorter": "alpha",
        "operationsSorter": "alpha",  # можно "method"
        "docExpansion": "list",
        "defaultModelsExpandDepth": -1,
        "displayRequestDuration": True,
        "tryItOutEnabled": True,
    }
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Protected API Docs",
        oauth2_redirect_url="/docs/oauth2-redirect",
        swagger_ui_parameters=swagger_ui_parameters,
    )

@app.get("/docs/oauth2-redirect", include_in_schema=False)
def swagger_ui_redirect(_: None = Depends(_check_docs_auth)):
    return get_swagger_ui_oauth2_redirect_html()

@app.get("/openapi.json", include_in_schema=False)
def protected_openapi(_: None = Depends(_check_docs_auth)):
    return JSONResponse(app.openapi())

# =========================
# DB POOL
# =========================
POOL_MIN, POOL_MAX = 1, 10
pool: SimpleConnectionPool = SimpleConnectionPool(
    POOL_MIN, POOL_MAX,
    host=PGHOST, port=PGPORT, dbname=PGDATABASE, user=PGUSER, password=PGPASSWORD
)

def db_exec(sql: str, params: Tuple[Any, ...] = (), fetch: str = "none"):
    """
    fetch: "one" | "all" | "none"
    """
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            if fetch == "one":
                row = cur.fetchone()
            elif fetch == "all":
                row = cur.fetchall()
            else:
                row = None
        conn.commit()
        return row
    finally:
        pool.putconn(conn)

# =========================
# INIT SCHEMA
# =========================
def init_db():
    db_exec("""
    CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        username VARCHAR UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_name VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_admin  BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    """)
    db_exec("""
    CREATE TABLE IF NOT EXISTS traffic_objects(
        id SERIAL PRIMARY KEY,
        name VARCHAR UNIQUE NOT NULL,
        object_address VARCHAR NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    """)
    db_exec("""
    CREATE TABLE IF NOT EXISTS devices(
        id SERIAL PRIMARY KEY,
        device_name VARCHAR NOT NULL,
        description TEXT,
        object_name VARCHAR NOT NULL,
        device_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    """)
    db_exec("""
    CREATE TABLE IF NOT EXISTS transfer_history(
        id SERIAL PRIMARY KEY,
        object_from VARCHAR NOT NULL,
        object_to VARCHAR NOT NULL,
        devices TEXT NOT NULL,
        device_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    """)
    db_exec("""CREATE UNIQUE INDEX IF NOT EXISTS devices_obj_devname_uniq ON devices(object_name, device_name);""")

def ensure_default_user():
    if not db_exec("SELECT id FROM users WHERE username=%s", (ADMIN_USERNAME,), fetch="one"):
        pwd_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        db_exec(
            "INSERT INTO users(username, password_hash, user_name, is_admin, is_active) VALUES (%s, %s, %s,%s,%s)",
            (ADMIN_USERNAME, pwd_hash, ADMIN_NAME, True, True)
        )

init_db()
ensure_default_user()

# =========================
# AUTH (Bearer token)
# =========================
def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

def make_token(username: str) -> str:
    ts = str(int(datetime.now(timezone.utc).timestamp()))
    payload = f"{username}:{ts}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f"{payload}:{sig}".encode()).decode()

def parse_token(token: str) -> Optional[str]:
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.split(":")
        if len(parts) != 3:
            return None
        username, ts, sig = parts
        expected = hmac.new(SECRET_KEY.encode(), f"{username}:{ts}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        row = db_exec("SELECT is_active FROM users WHERE username=%s", (username,), fetch="one")
        return username if (row and bool(row[0])) else None
    except Exception:
        return None

def require_bearer_token(authorization: str = Header(None)):
    """
    Заголовок: Authorization: Bearer <token>
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing_bearer_token")
    token = authorization.split(" ", 1)[1].strip()
    username = parse_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="invalid_token")
    return username


def parse_token_user(token: str) -> Optional[str]:
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.split(":")
        if len(parts) != 3:
            return None
        username, ts, sig = parts
        expected = hmac.new(SECRET_KEY.encode(), f"{username}:{ts}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        row = db_exec("SELECT * FROM users WHERE username=%s", (username,), fetch="one")
        return row
    except Exception:
        return None

def require_bearer_token_user(authorization: str = Header(None)):
    """
    Заголовок: Authorization: Bearer <token>
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing_bearer_token")
    token = authorization.split(" ", 1)[1].strip()
    username = parse_token_user(token)
    if not username:
        raise HTTPException(status_code=401, detail="invalid_token")
    return username

# =========================
# HELPERS
# =========================
def object_exists(object_name: str) -> bool:
    return bool(db_exec("SELECT 1 FROM traffic_objects WHERE name=%s", (object_name,), fetch="one"))

def get_object_by_id(object_id: int):
    return db_exec("SELECT id, name, object_address, created_at FROM traffic_objects WHERE id=%s",
                   (object_id,), fetch="one")

def get_object_by_name_exact(object_name: str):
    return db_exec("SELECT id, name, object_address, created_at FROM traffic_objects WHERE name=%s",
                   (object_name,), fetch="one")

def get_device_by_id(device_id: int):
    return db_exec("""
        SELECT id, device_name, description, object_name,
               COALESCE(device_count, 0) AS device_count, created_at
        FROM devices WHERE id=%s
    """, (device_id,), fetch="one")

def get_devices_by_name_global(device_name: str):
    return db_exec("""
        SELECT id, device_name, description, object_name,
               COALESCE(device_count, 0) AS device_count, created_at
        FROM devices WHERE device_name=%s
    """, (device_name,), fetch="all")

def get_device_by_name_in_object(device_name: str, object_name: str):
    return db_exec("""
        SELECT id, device_name, description, object_name,
               COALESCE(device_count, 0) AS device_count, created_at
        FROM devices WHERE device_name=%s AND object_name=%s
    """, (device_name, object_name), fetch="one")

def global_counters() -> Dict[str, int]:
    loc = db_exec("SELECT COUNT(*) FROM traffic_objects", fetch="one")[0]
    dev = db_exec("SELECT COUNT(*) FROM devices", fetch="one")[0]
    trs = db_exec("SELECT COUNT(*) FROM transfer_history", fetch="one")[0]
    return {"total_locations": int(loc), "total_devices": int(dev), "total_transfers": int(trs)}

def collect_stats() -> Dict[str, Any]:
    counters = global_counters()
    rows = db_exec("""
        SELECT o.id, o.name, COUNT(d.id)
        FROM traffic_objects o
        LEFT JOIN devices d ON d.object_name = o.name
        GROUP BY o.id, o.name
        ORDER BY o.id
    """, fetch="all") or []
    per_object = [{"object_id": r[0], "object_name": r[1], "devices_count": int(r[2] or 0)} for r in rows]
    return {"time": get_uzbek_time_iso(), **counters, "per_object": per_object}

def get_devices_for_object(object_name: str):
    return db_exec(
        """
        SELECT id, device_name, description, object_name,
               COALESCE(device_count, 0) AS device_count, created_at
        FROM devices
        WHERE object_name = %s
        ORDER BY id
        """,
        (object_name,),
        fetch="all"
    ) or []
# =========================
# REQUEST MODELS (с примерами)
# =========================
class LoginRequest(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="Admin123!")


class CreateObjectRequest(BaseModel):
    object_name: str = Field(..., example="ГАИ №1")
    object_address: str = Field(..., example="г. Ташкент, ул. Мирзо Улугбека, 12")

class CreateDeviceRequest(BaseModel):
    device_name: str = Field(..., example="Камера-01")
    object_name: str = Field(..., example="ГАИ №1")
    description: Optional[str] = Field(None, example="Въезд")
    device_count: Optional[int] = Field(None, example=7, description="Количество устройств")

class TransferRequest(BaseModel):
    device_id: Optional[int] = Field(None, example=7, description="Либо device_id, либо device_name")
    device_name: Optional[str] = Field(None, example="Камера-01")
    from_object_name: Optional[str] = Field(None, example="ГАИ №1")
    to_object_name: str = Field(..., example="ГАИ №2")
    device_count: Optional[int] = Field(None, example=7, description="Количество устройств")

# =========================
# ENDPOINTS
# =========================

# -------- Auth --------
@app.post("/api/login", tags=["1. Auth"], summary="Login → Bearer-токен")
def api_login(body: LoginRequest):
    """
    Принимает: {"username": "...", "password": "..."}.
    Возвращает: {"token": "...", "time": "..."}.
    """
    username = body.username.strip()
    password = body.password.strip()
    row = db_exec("SELECT password_hash, is_active FROM users WHERE username=%s", (username,), fetch="one")
    if not row:
        raise HTTPException(status_code=401, detail="user_not_found")
    pwd_hash, is_active = row[0], bool(row[1])
    if not is_active or not verify_password(password, pwd_hash):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    return {"time": get_uzbek_time_iso(), "token": make_token(username)}

@app.get("/api/user", tags=["1. Auth"], summary="About The User")
def get_user(user: str = Depends(require_bearer_token_user)):
    if not user:
        raise HTTPException(status_code=401, detail="user_not_found")
    return {"username": user[1], "name": user[3], "time": get_uzbek_time_iso().split('+')[0]}

# -------- Objects --------
@app.post("/api/objects", tags=["2. Objects"], summary="Создать объект")
def http_create_object(body: CreateObjectRequest, user: str = Depends(require_bearer_token)):
    """
    Тело: {"object_name": "ГАИ №1", "object_address": "адрес"}.
    """
    object_name = body.object_name.strip()
    object_address = body.object_address.strip()
    if not object_name or not object_address:
        raise HTTPException(status_code=400, detail="object_name_and_address_required")
    if object_exists(object_name):
        raise HTTPException(status_code=409, detail="object_exists")
    db_exec("INSERT INTO traffic_objects(name, object_address) VALUES (%s, %s)", (object_name, object_address))
    return {"ok": True, "object": {"name": object_name, "object_address": object_address}, "time": get_uzbek_time_iso()}

@app.get("/api/objects/{object_id}", tags=["2. Objects"], summary="Объект по ID")
def http_get_object_by_id(object_id: int = Path(..., example=1), user: str = Depends(require_bearer_token)):
    row = get_object_by_id(object_id)
    if not row:
        raise HTTPException(status_code=404, detail="object_not_found")
    return {"id": row[0], "name": row[1], "object_address": row[2],
            "created_at": row[3].isoformat() if row[3] else None}

@app.get("/api/objects/by-name/{object_name}", tags=["2. Objects"], summary="Объект по имени")
def http_get_object_by_name(object_name: str = Path(..., example="ГАИ №1"), user: str = Depends(require_bearer_token)):
    row = get_object_by_name_exact(object_name)
    if not row:
        raise HTTPException(status_code=404, detail="object_not_found")
    return {"id": row[0], "name": row[1], "object_address": row[2],
            "created_at": row[3].isoformat() if row[3] else None}

<<<<<<< HEAD
@app.get("/api/objects", tags=["2. Objects"], summary="Список объектов (поиск и пагинация)")
def http_list_objects(
    q: Optional[str] = Query(None, example="Таш"),
    limit: int = Query(50, ge=1, le=200, example=50),
    offset: int = Query(0, ge=0, example=0)
, user: str = Depends(require_bearer_token)):
    limit = max(1, min(limit, 200)); offset = max(0, offset)
    if q:
        patt = f"%{q}%"
        rows = db_exec("""
            SELECT id, name, object_address, created_at
            FROM traffic_objects
            WHERE name ILIKE %s OR object_address ILIKE %s
            ORDER BY name LIMIT %s OFFSET %s
        """, (patt, patt, limit, offset), fetch="all") or []
    else:
        rows = db_exec("""
            SELECT id, name, object_address, created_at
            FROM traffic_objects
            ORDER BY name LIMIT %s OFFSET %s
        """, (limit, offset), fetch="all") or []
    return [{"id": r[0], "name": r[1], "object_address": r[2],
             "created_at": r[3].isoformat() if r[3] else None} for r in rows]
=======
@app.get("/api/objects", tags=["2. Objects"], summary="Список объектов (поиск, пагинация) + их устройства и суммы")
def http_list_objects(
    q: Optional[str] = Query(None, example=""),
    limit: int = Query(50, ge=1, le=200, example=50),
    offset: int = Query(0, ge=0, example=0),
    user: str = Depends(require_bearer_token)
):
    """
    Возвращает массив элементов в формате, идентичном /api/object/full:
    [
      {
        "object": { id, name, object_address, created_at },
        "devices_count": <кол-во строк devices для объекта>,
        "device_count_total": <сумма device_count>,
        "devices": [ {id, device_name, description, object_name, device_count, created_at}, ... ]
      },
      ...
    ]
    """
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    # 1) выбираем объекты (с поиском/пагинацией)
    if q:
        patt = f"%{q}%"
        obj_rows = db_exec("""
            SELECT id, name, object_address, created_at
            FROM traffic_objects
            WHERE name ILIKE %s OR object_address ILIKE %s
            ORDER BY name
            LIMIT %s OFFSET %s
        """, (patt, patt, limit, offset), fetch="all") or []
    else:
        obj_rows = db_exec("""
            SELECT id, name, object_address, created_at
            FROM traffic_objects
            ORDER BY name
            LIMIT %s OFFSET %s
        """, (limit, offset), fetch="all") or []

    if not obj_rows:
        return []

    # 2) одним запросом подтягиваем устройства для всех выбранных объектов
    object_names = [r[1] for r in obj_rows]  # name
    dev_rows = db_exec("""
        SELECT id, device_name, description, object_name,
               COALESCE(device_count, 0) AS device_count, created_at
        FROM devices
        WHERE object_name = ANY(%s)
        ORDER BY object_name, id
    """, (object_names,), fetch="all") or []

    # 3) группируем девайсы по объекту
    devices_by_object: dict[str, list[dict]] = {}
    for r in dev_rows:
        d = {
            "id": r[0],
            "device_name": r[1],
            "description": r[2],
            "object_name": r[3],
            "device_count": int(r[4] or 0),
            "created_at": r[5].isoformat() if r[5] else None
        }
        devices_by_object.setdefault(r[3], []).append(d)  # r[3] = object_name

    # 4) собираем итог в формате /api/object/full
    result = []
    for r in obj_rows:
        oid, oname, oaddr, ocreated = r[0], r[1], r[2], (r[3].isoformat() if r[3] else None)
        devs = devices_by_object.get(oname, [])
        item = {
            "object": {
                "id": oid,
                "name": oname,
                "object_address": oaddr,
                "created_at": ocreated
            },
            "devices_count": len(devs),
            "device_count_total": sum(d["device_count"] for d in devs),
            "devices": devs
        }
        result.append(item)

    return result
>>>>>>> c6c12ee (first commit)


@app.get(
    "/api/object/full",
    tags=["2. Objects"],
    summary="Объект + его устройства и суммарное количество",
    description="Возвращает объект по object_name, список его устройств и суммарное количество device_count."
)
def http_get_object_full(
    object_name: str = Query(..., min_length=1, description="Точное имя объекта"),
    user: str = Depends(require_bearer_token)  # закрыто токеном
):
    row = get_object_by_name_exact(object_name.strip())
    if not row:
        raise HTTPException(status_code=404, detail="object_not_found")

    oid, oname, oaddr, ocreated = row[0], row[1], row[2], (row[3].isoformat() if row[3] else None)

    dev_rows = get_devices_for_object(oname)
    devices = [{
        "id": r[0],
        "device_name": r[1],
        "description": r[2],
        "object_name": r[3],
        "device_count": int(r[4] or 0),
        "created_at": r[5].isoformat() if r[5] else None
    } for r in dev_rows]

    return {
        "object": {"id": oid, "name": oname, "object_address": oaddr, "created_at": ocreated},
        "devices_count": len(devices),
        "device_count_total": sum(d["device_count"] for d in devices),
        "devices": devices
    }

# -------- Devices --------
@app.post("/api/devices", tags=["3. Devices"], summary="Создать устройство (или увеличить count)")
def http_create_device(body: CreateDeviceRequest, user: str = Depends(require_bearer_token)):
    """
    Если в объекте уже есть device_name — увеличиваем device_count.
    Тело: {"device_name":"Камера-01","object_name":"ГАИ №1","description":"Въезд","device_count":5}
    """
    device_name = body.device_name.strip()
    object_name = body.object_name.strip()
    description = (body.description or "").strip() or None
    device_count = int(body.device_count or 1)

    if not device_name or not object_name:
        raise HTTPException(status_code=400, detail="device_name_and_object_name_required")
    if device_count <= 0:
        raise HTTPException(status_code=400, detail="device_count_must_be_positive")
    if not object_exists(object_name):
        raise HTTPException(status_code=404, detail="object_not_found")

    row = db_exec("""
        INSERT INTO devices(device_name, description, object_name, device_count)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (object_name, device_name)
        DO UPDATE SET
          device_count = COALESCE(devices.device_count,0) + EXCLUDED.device_count,
          description  = COALESCE(EXCLUDED.description, devices.description)
        RETURNING id, device_name, object_name, description, COALESCE(device_count,0)
    """, (device_name, description, object_name, device_count), fetch="one")

    return {
        "ok": True,
        "device": {
            "id": int(row[0]),
            "device_name": row[1],
            "object_name": row[2],
            "description": row[3],
            "device_count": int(row[4] or 0),
        },
        "time": get_uzbek_time_iso()
    }

@app.get("/api/devices/{device_id}", tags=["3. Devices"], summary="Устройство по ID")
def http_get_device_by_id(device_id: int = Path(..., example=7), user: str = Depends(require_bearer_token)):
    row = get_device_by_id(device_id)
    if not row:
        raise HTTPException(status_code=404, detail="device_not_found")
    return {"id": row[0], "device_name": row[1], "description": row[2],
            "object_name": row[3], "device_count": int(row[4] or 0),
            "created_at": row[5].isoformat() if row[5] else None}

@app.get("/api/devices/by-name", tags=["3. Devices"], summary="Устройство по имени (+ фильтры)")
def http_get_device_by_name(
    device_name: str = Query(..., example="Камера-01"),
    object_name: Optional[str] = Query(None, example="ГАИ №1"),
    description: Optional[str] = Query(None, example="Въезд")
, user: str = Depends(require_bearer_token)):
    """
    Возвращает единственный матч или список кандидатов, если совпало несколько.
    Можно уточнить object_name и/или description.
    """
    params = [device_name]
    sql = """SELECT id, device_name, description, object_name,
                        COALESCE(device_count,0) AS device_count, created_at
                 FROM devices WHERE device_name=%s"""
    if object_name:
        sql += " AND object_name=%s"
        params.append(object_name)
    rows = db_exec(sql, tuple(params), fetch="all") or []
    if description is not None:
        rows = [r for r in rows if ((r[2] or "").strip() == description.strip())]
    if len(rows) == 0:
        raise HTTPException(status_code=404, detail="device_not_found")
    if len(rows) == 1:
        r = rows[0]
        return {"id": r[0], "device_name": r[1], "description": r[2], "object_name": r[3],
                "device_count": int(r[4] or 0),
                "created_at": r[5].isoformat() if r[5] else None}
    return {"multiple": True, "devices": [
        {"id": r[0], "device_name": r[1], "description": r[2], "object_name": r[3],
         "device_count": int(r[4] or 0),
         "created_at": r[5].isoformat() if r[5] else None} for r in rows
    ]}

@app.get("/api/devices", tags=["3. Devices"], summary="Список устройств (фильтры и пагинация)")
def http_list_devices(
    q: Optional[str] = Query(None, example="ка"),
    object_name: Optional[str] = Query(None, example="ГАИ №1"),
    limit: int = Query(50, ge=1, le=200, example=50),
    offset: int = Query(0, ge=0, example=0)
, user: str = Depends(require_bearer_token)):
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    base = "SELECT id, device_name, description, object_name, COALESCE(device_count,0) AS device_count, created_at FROM devices"
    where, params = [], []
    if object_name:
        where.append("object_name=%s")
        params.append(object_name)
    if q:
        patt = f"%{q}%"
        where.append("(device_name ILIKE %s OR COALESCE(description,'') ILIKE %s OR object_name ILIKE %s)")
        params += [patt, patt, patt]
    sql = base + (" WHERE " + " AND ".join(where) if where else "") + \
          " ORDER BY object_name, id LIMIT %s OFFSET %s"
    params += [limit, offset]
    rows = db_exec(sql, tuple(params), fetch="all") or []
    return [{"id": r[0], "device_name": r[1], "description": r[2], "object_name": r[3],
             "device_count": int(r[4] or 0),
             "created_at": r[5].isoformat() if r[5] else None} for r in rows]

# -------- Transfer --------
@app.post("/api/transfer", tags=["4. Transfer"], summary="Перенести N штук устройства в другой объект")
def http_transfer(body: TransferRequest, user: str = Depends(require_bearer_token)):
    """
    Перенос по device_id или по device_name (+опц. from_object_name).
    Переносит ровно device_count (по умолчанию = 1).
    - На исходном объекте device_count уменьшается; если стал 0 — запись удаляется.
    - На целевом объекте device_count увеличивается; если записи нет — создаётся.
    - В историю пишется количество.
    """
    device_id = body.device_id
    device_name_payload = (body.device_name or "").strip()
    from_object_name = (body.from_object_name or "").strip()
    to_object_name = body.to_object_name.strip()
    transfer_count = int(body.device_count or 1)

    if not to_object_name:
        raise HTTPException(status_code=400, detail="to_object_name_required")
    if transfer_count <= 0:
        raise HTTPException(status_code=400, detail="device_count_must_be_positive")
    if not object_exists(to_object_name):
        raise HTTPException(status_code=404, detail="target_object_not_found")

    # Найдём исходную запись устройства
    dev_row = None
    if device_id is not None:
        try:
            dev_row = get_device_by_id(int(device_id))
        except Exception:
            dev_row = None
    else:
        if not device_name_payload:
            raise HTTPException(status_code=400, detail="device_id_or_device_name_required")
        if from_object_name:
            dev_row = get_device_by_name_in_object(device_name_payload, from_object_name)
        else:
            rows = get_devices_by_name_global(device_name_payload) or []
            if len(rows) == 1:
                dev_row = rows[0]
            elif len(rows) > 1:
                raise HTTPException(status_code=409, detail="ambiguous_name")
    if not dev_row:
        raise HTTPException(status_code=404, detail="device_not_found")

    did, dname, desc, src_object, src_count, _created = dev_row
    if src_object == to_object_name:
        raise HTTPException(status_code=409, detail="already_in_target")
    if transfer_count > int(src_count or 0):
        raise HTTPException(status_code=409, detail="not_enough_in_source")

    # Транзакция: списать у источника, начислить цели, записать историю
    conn = pool.getconn()
    try:
        with conn:
            with conn.cursor() as cur:
                # 1) списываем у источника
                if transfer_count == int(src_count or 0):
                    cur.execute("DELETE FROM devices WHERE id=%s", (did,))
                    src_left = 0
                else:
                    cur.execute(
                        "UPDATE devices SET device_count = COALESCE(device_count,0) - %s WHERE id=%s",
                        (transfer_count, did)
                    )
                    src_left = int(src_count) - transfer_count

                # 2) начисляем цели (UPSERT)
                cur.execute("""
                    INSERT INTO devices(device_name, description, object_name, device_count)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (object_name, device_name)
                    DO UPDATE SET device_count = COALESCE(devices.device_count,0) + EXCLUDED.device_count
                    RETURNING id, COALESCE(device_count,0)
                """, (dname, desc, to_object_name, transfer_count))
                tgt_id, tgt_total = cur.fetchone()

                # 3) история (сохраним devices как JSON-строку списка имён)
                cur.execute("""
                    INSERT INTO transfer_history(object_from, object_to, devices, device_count)
                    VALUES (%s, %s, %s, %s)
                """, (src_object, to_object_name, json.dumps([dname]), transfer_count))

        return {
            "ok": True,
            "device_name": dname,
            "moved_count": transfer_count,
            "from_object_name": src_object,
            "to_object_name": to_object_name,
            "source_left": src_left,
            "target_total": int(tgt_total or 0),
            "time": get_uzbek_time_iso(),
        }
    finally:
        pool.putconn(conn)

def _parse_devices(val: str):
    if val is None:
        return []
    try:
        return json.loads(val)            # если хранится JSON
    except Exception:
        try:
            res = ast.literal_eval(val)   # если строка в виде python-списка
            return res if isinstance(res, list) else [str(res)]
        except Exception:
            return [val] if val else []

@app.get(
    "/api/transfer/history",
    tags=["4. Transfer"],
    summary="История переносов (последние N)",
    description="Отдаёт последние записи истории переносов. Параметры: только limit. Требуется Bearer-токен."
)
def http_transfer_history_simple(
    limit: int = Query(50, ge=1, le=200, example=50, description="Сколько последних записей вернуть"),
    user: str = Depends(require_bearer_token)  # закрыто токеном
):
    rows = db_exec(
        """
        SELECT id, object_from, object_to, devices, device_count, created_at
        FROM transfer_history
        ORDER BY id DESC
        LIMIT %s
        """,
        (limit,),
        fetch="all"
    ) or []

    items = [{
        "id": r[0],
        "object_from": r[1],
        "object_to": r[2],
        "devices": _parse_devices(r[3]),
        "device_count": int(r[4] or 0),
        "created_at": r[5].isoformat() if r[5] else None
    } for r in rows]

    return {"items": items, "limit": limit}



# -------- Search --------
@app.get("/api/search", tags=["5. Search"], summary="Поиск по объектам и устройствам + счётчики")
def http_search(
    q: str = Query(..., min_length=1, example="ка"),
    limit: int = Query(50, ge=1, le=200, example=50),
    offset: int = Query(0, ge=0, example=0)
, user: str = Depends(require_bearer_token)):
    """
    Ищет (ILIKE '%q%') в объектах (имя/адрес) и устройствах (имя/описание/объект).
    Возвращает также counters: total_locations, total_devices, total_transfers.
    """
    patt = f"%{q}%"
    obj_rows = db_exec("""
        SELECT id, name, object_address, created_at
        FROM traffic_objects
        WHERE name ILIKE %s OR object_address ILIKE %s
        ORDER BY name LIMIT %s OFFSET %s
    """, (patt, patt, limit, offset), fetch="all") or []
    objects = [{"id": r[0], "name": r[1], "object_address": r[2],
                "created_at": r[3].isoformat() if r[3] else None} for r in obj_rows]

    dev_rows = db_exec("""
        SELECT id, device_name, description, object_name, created_at
        FROM devices
        WHERE device_name ILIKE %s OR COALESCE(description,'') ILIKE %s OR object_name ILIKE %s
        ORDER BY device_name LIMIT %s OFFSET %s
    """, (patt, patt, patt, limit, offset), fetch="all") or []
    devices = [{"id": r[0], "device_name": r[1], "description": r[2],
                "object_name": r[3], "created_at": r[4].isoformat() if r[4] else None} for r in dev_rows]

    counters = global_counters()
    return {"q": q, "counters": counters, "objects": objects, "devices": devices, "time": get_uzbek_time_iso()}

# -------- Stats --------
@app.get("/api/stats", tags=["6. Stats"], summary="Сводная статистика")
def http_stats(user: str = Depends(require_bearer_token)):
    """
    total_locations, total_devices, total_transfers + распределение устройств по объектам.
    """
    return collect_stats()
