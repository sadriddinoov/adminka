from dotenv import load_dotenv
import os

load_dotenv()

PGHOST = os.getenv("PGHOST")
PGPORT = int(os.getenv("PGPORT"))
PGDATABASE = os.getenv("PGDATABASE")
PGUSER = os.getenv("PGUSER", "postgres")
PGPASSWORD = os.getenv("PGPASSWORD")
SECRET_KEY = os.getenv("SECRET_KEY")
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", "2592000"))  # 30 * 24 * 60 * 60
>>>>>>> 3e7dc91 (first commit)
>>>>>>> e6ccade (update)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_NAME = os.getenv("ADMIN_NAME")

DOCS_USERNAME = os.getenv("DOCS_USERNAME")
DOCS_PASSWORD = os.getenv("DOCS_PASSWORD")