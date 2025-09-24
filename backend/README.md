# GAI App (FastAPI) — README

Красивый и понятный гайд по установке, настройке базы и запуску проекта.

---

## 🚀 Стек
- **Python** ≥ 3.11
- **FastAPI** + **Uvicorn**
- **PostgreSQL**
- (опционально) **pipenv/venv** для виртуального окружения

---

## 🧰 Предварительные требования
1. Установлен Python 3.11+ (`python --version`).
2. Установлен PostgreSQL 13+ (`psql --version`).
3. Права на установку пакетов (`pip`, `virtualenv`/`venv`).

---

## 🗄️ Создание базы данных (PostgreSQL)

**Цель:** создать базу `gai_app`, убедиться, что у пользователя `postgres` есть пароль `yourpass`.

### Вариант A: Linux (Ubuntu/Debian)
```bash
# зайти в psql от пользователя postgres
sudo -u postgres psql

-- внутри psql:
ALTER USER postgres WITH PASSWORD 'yourpass';
CREATE DATABASE gai_app OWNER postgres;
-- (рекомендуется) устанавливаем часовой пояс на Узбекистан
ALTER DATABASE gai_app SET timezone TO 'Asia/Tashkent';
\q
```

### Вариант B: Windows / любой OS с доступом к psql
```bash
psql -U postgres
-- введите пароль, если будет запрошен

-- внутри psql:
ALTER USER postgres WITH PASSWORD 'yourpass';
CREATE DATABASE gai_app OWNER postgres;
ALTER DATABASE gai_app SET timezone TO 'Asia/Tashkent';
\q
```

> Если сервер PostgreSQL слушает только сокеты/локальные подключения — убедитесь, что он принимает соединения по `127.0.0.1:5432` (проверьте `postgresql.conf` и `pg_hba.conf`).

---

## 🔐 Переменные окружения

Создайте файл **`.env`** в корне проекта (рядом с `app.py`) со следующим содержимым:

```env
# === SECURITY ===
SECRET_KEY=change-me-please                 # используй длинную случайную строку
TOKEN_TTL_SECONDS=2592000                   # 30 дней (30*24*60*60)

# === DATABASE ===
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=gai_app
PGUSER=postgres
PGPASSWORD=bilmiman_17

# (опционально) для логов/времени
TZ=Asia/Tashkent
```

> `TOKEN_TTL_SECONDS` — время жизни токена в секундах. По умолчанию 30 дней, как мы настроили в коде.

---

## 🏗️ Установка зависимостей

### Виртуальное окружение (рекомендуется)
```bash
# в корне проекта
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows (PowerShell)
# .\.venv\Scripts\Activate.ps1

# обновим pip и установим зависимости
pip install --upgrade pip
pip install -r requirements.txt
```
Если файла `requirements.txt` нет — установи минимум:
```bash
pip install fastapi uvicorn psycopg2-binary python-dotenv passlib[bcrypt]
```

---

## ▶️ Запуск приложения (dev)

Из корня, где лежит `app.py`:

```bash
# активируй виртуальное окружение, если еще не активировано
# Linux/macOS:  source .venv/bin/activate
# Windows:      .\.venv\Scripts\Activate.ps1

# загружаем переменные из .env (python-dotenv подхватит автоматически при импорте)
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

После запуска:
- Документация Swagger: **http://127.0.0.1:8000/docs**
- ReDoc: **http://127.0.0.1:8000/redoc**

> Если команда `uvicorn app:app` выдаёт «Could not import module "app"», убедись, что **файл называется `app.py`** и ты запускаешь команду **из той же папки**, где он лежит.

---

## 🧪 Быстрый тест (логин → токен)
1. Создай пользователя в базе (через SQL/скрипт) или используй уже существующего.
2. Выполни запрос на логин:
    ```bash
    curl -X POST "http://127.0.0.1:8000/api/login" \
         -H "Content-Type: application/json" \
         -d '{"username":"admin","password":"admin"}'
    ```
3. В ответе будет `token`, `expires_at` и `ttl_seconds`.
4. Дальше добавляй заголовок `Authorization: Bearer <token>` ко всем защищённым запросам.

---

## ⚙️ Полезные команды

```bash
# форматирование (если используете):
pip install black isort
black .
isort .
```

```bash
# запуск без авто-перезапуска (prod-лайт):
uvicorn app:app --host 0.0.0.0 --port 8000
```

---

## ❗️ Troubleshooting

- **FATAL: password authentication failed for user "postgres"**
  - Проверь пароль (`yourpass`) и строку подключения в `.env`.
- **could not connect to server: Connection refused**
  - Убедись, что PostgreSQL запущен и слушает `127.0.0.1:5432`.
- **Could not import module "app"**
  - Запускай из директории, где лежит `app.py`, или укажи путь модулем: `python -m uvicorn app:app`.

---

## 📦 Структура (минимум)
```
.
├── app.py
├── .env
├── requirements.txt
└── README.md
```

---

## 📝 Примечание по токенам
Мы добавили TTL: **токен валиден 30 дней** с момента логина. Поменять срок можно через `TOKEN_TTL_SECONDS` в `.env`.

Удачной работы! 💙
