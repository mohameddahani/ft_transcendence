import sqlite3

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app import config

# a few Postgres connections, opened once and lent to each request
pool = ConnectionPool(
    config.DATABASE_URL,
    min_size=1,
    max_size=10,
    timeout=5,                              # wait at most 5 s for a free connection
    check=ConnectionPool.check_connection,  # test a connection before lending it
    kwargs={"row_factory": dict_row},       # rows come back as dicts
    open=True,
)


def fetch_all(sql: str, params: tuple = ()) -> list[dict]:
    with pool.connection() as conn:
        return conn.execute(sql, params).fetchall()


def fetch_one(sql: str, params: tuple = ()) -> dict | None:
    with pool.connection() as conn:
        return conn.execute(sql, params).fetchone()


# conversation memory lives in our own SQLite file, because Postgres is read-only for us
def _memory(sql: str, params: tuple = ()) -> list[tuple]:
    conn = sqlite3.connect(config.MEMORY_DB)
    try:
        rows = conn.execute(sql, params).fetchall()
        conn.commit()
        return rows
    finally:
        conn.close()


def init_memory() -> None:
    _memory("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
    _memory("CREATE INDEX IF NOT EXISTS messages_thread ON messages (thread_id, user_id)")


def save_message(thread_id: str, user_id: str, role: str, text: str) -> None:
    _memory("INSERT INTO messages (thread_id, user_id, role, text) VALUES (?, ?, ?, ?)",
            (thread_id, user_id, role, text))


def load_messages(thread_id: str, user_id: str, limit: int = 20) -> list[dict]:
    # user_id comes from the token, so nobody can load someone else's conversation
    rows = _memory("""
        SELECT role, text FROM messages
        WHERE thread_id = ? AND user_id = ?
        ORDER BY id DESC LIMIT ?""", (thread_id, user_id, limit))
    return [{"role": role, "text": text} for role, text in reversed(rows)]
