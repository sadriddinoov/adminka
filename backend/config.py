from dotenv import load_dotenv
import os

load_dotenv()

PGHOST = os.getenv("PGHOST")
PGPORT = int(os.getenv("PGPORT"))
PGDATABASE = os.getenv("PGDATABASE")
PGUSER = os.getenv("PGUSER", "postgres")
PGPASSWORD = os.getenv("PGPASSWORD")
SECRET_KEY = os.getenv("SECRET_KEY")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_NAME = os.getenv("ADMIN_NAME")

DOCS_USERNAME = os.getenv("DOCS_USERNAME")
DOCS_PASSWORD = os.getenv("DOCS_PASSWORD")