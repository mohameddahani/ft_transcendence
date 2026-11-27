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


def fetch_all(sql: str, params: tuple | dict = ()) -> list[dict]:
    with pool.connection() as conn:
        return conn.execute(sql, params).fetchall()


def fetch_one(sql: str, params: tuple | dict = ()) -> dict | None:
    with pool.connection() as conn:
        return conn.execute(sql, params).fetchone()


# our own tables (schema ai) through a second role that can write only there
store_pool = ConnectionPool(
    config.STORE_DATABASE_URL,
    min_size=1,
    max_size=10,
    timeout=5,
    check=ConnectionPool.check_connection,
    kwargs={"row_factory": dict_row},
    open=True,
)


def store(sql: str, params: tuple | dict = ()) -> list[dict]:
    with store_pool.connection() as conn:
        cur = conn.execute(sql, params)
        return cur.fetchall() if cur.description else []


def save_message(thread_id: str, user_id: str, role: str, text: str) -> None:
    store("INSERT INTO ai.messages (thread_id, user_id, role, text) VALUES (%s, %s, %s, %s)",
          (thread_id, user_id, role, text))


def load_messages(thread_id: str, user_id: str, limit: int = 20) -> list[dict]:
    # user_id comes from the token, so nobody can load someone else's conversation
    rows = store("""
        SELECT role, text, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at FROM ai.messages
        WHERE thread_id = %s AND user_id = %s
        ORDER BY id DESC LIMIT %s""", (thread_id, user_id, limit))
    return list(reversed(rows))


# the user's conversations, newest first, each titled with its first question
def list_threads(user_id: str, limit: int = 30) -> list[dict]:
    return store("""
        SELECT thread_id::text AS thread_id,
               (SELECT left(f.text, 60) FROM ai.messages f
                 WHERE f.thread_id = m.thread_id AND f.user_id = m.user_id AND f.role = 'user'
                 ORDER BY f.id LIMIT 1) AS title,
               to_char(max(created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_at
        FROM ai.messages m
        WHERE user_id = %s
        GROUP BY thread_id, user_id
        ORDER BY max(id) DESC
        LIMIT %s""", (user_id, limit))


# returns how many messages were deleted; another user's thread id deletes nothing
def delete_thread(thread_id: str, user_id: str) -> int:
    return len(store("DELETE FROM ai.messages WHERE thread_id = %s AND user_id = %s RETURNING id",
                     (thread_id, user_id)))
