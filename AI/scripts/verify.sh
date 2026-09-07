#!/usr/bin/env bash
# Stack verification. Run after any change: ./scripts/verify.sh
# Exits non-zero if anything is wrong, so it can gate a commit.
set -uo pipefail
cd "$(dirname "$0")/.."
FAIL=0
ok()   { printf "  \033[32m✓\033[0m %-38s %s\n" "$1" "${2:-}"; }
bad()  { printf "  \033[31m✗\033[0m %-38s %s\n" "$1" "${2:-}"; FAIL=1; }
chk()  { [ "$2" = "$3" ] && ok "$1" "$2" || bad "$1" "got '$2', want '$3'"; }

DB="PGPASSWORD=${POSTGRES_PASSWORD:-1234} psql -h 127.0.0.1 -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-ft_transcendence} -tAc"
q() { eval "$DB \"\$1\"" 2>/dev/null | tr -d ' '; }

echo "── runtime ──"
colima status >/dev/null 2>&1 && ok "colima running" || bad "colima running" "start with: colima start"
chk "postgres container healthy" "$(docker inspect gym_postgres --format '{{.State.Health.Status}}' 2>/dev/null)" "healthy"
chk "bound to loopback only"     "$(docker port gym_postgres 5432/tcp 2>/dev/null | head -1)" "127.0.0.1:5432"

echo "── schema ──"
chk "migrations applied"  "$(q 'select count(*) from _prisma_migrations where finished_at is not null')" "24"
chk "tables present"      "$(q "select count(*) from information_schema.tables where table_schema='public' and table_name not like '_prisma%'")" "15"
for t in check_ins feedbacks; do
  n=$(q "select count(*) from information_schema.tables where table_schema='public' and table_name='$t'")
  [ "$n" = "1" ] && ok "$t present" || printf "  \033[33m⋯\033[0m %-38s %s\n" "$t" "pending Dahani (blocks seeder + sentiment)"
done

echo "── fixture data ──"
# Two gyms, not one. Every tenant-scoping assertion in check_scope.py is vacuous
# against a single-tenant database: "my rows" and "all rows" are the same set.
chk "gyms (tenants)" "$(q "select count(*) from users where role='ADMIN'")" "2"
chk "members"     "$(q 'select count(*) from members')" "5"
chk "memberships" "$(q 'select count(*) from memberships')" "5"
chk "payments"    "$(q 'select count(*) from payments')" "5"
chk "plan prices differ per gym" "$(q 'select count(distinct price) from membership_plan_durations')" "2"
EXPIRED=$(q "select count(*) from memberships where expires_at < now()")
SOON=$(q "select count(*) from memberships where expires_at >= now() and expires_at < now() + interval '7 days'")
ACTIVE=$(q "select count(*) from memberships where expires_at >= now() + interval '7 days'")
chk "expired|soon|active split" "$EXPIRED|$SOON|$ACTIVE" "1|1|3"
chk "revenue spans >1 month" "$(q "select count(distinct date_trunc('month', paid_at)) from payments")" "4"

echo "── read-only role ──"
# Guardrail #1 is only real if the *database* refuses. Assert both directions:
# the role can read what it needs, and is denied everything it must never see.
ro() { PGPASSWORD="${AI_DB_PASSWORD:-ai_readonly_dev_pw}" psql -q -t -A \
        -h 127.0.0.1 -p "${POSTGRES_PORT:-5432}" -U "${AI_DB_USER:-ai_readonly}" \
        -d "${POSTGRES_DB:-ft_transcendence}" -c "$1" 2>&1 | head -1; }

if ro "select 1" | grep -q "^1$"; then
  ok "ai_readonly can connect"
  chk "can read members read-model" "$(ro 'select count(*) from members')" "5"
  for probe in \
      "members.password|select password from members limit 1" \
      "users.password|select password from users limit 1" \
      "select * on members|select * from members limit 1" \
      "user_refresh_tokens|select 1 from user_refresh_tokens limit 1" \
      "member_refresh_tokens|select 1 from member_refresh_tokens limit 1" \
      "user_action_tokens|select 1 from user_action_tokens limit 1" \
      "member_action_tokens|select 1 from member_action_tokens limit 1" \
      "write to members|update members set first_name='x'" \
      "create table|create table _evil(i int)" ; do
    label="${probe%%|*}"; sql="${probe#*|}"
    # Capture first: `ro` ends in a pipeline containing a deliberately-failing psql,
    # so under `set -o pipefail` piping it straight into grep would report the
    # denial as a test failure.
    out=$(ro "$sql")
    if [[ "$out" == *"permission denied"* ]]; then
      ok "denied: $label"
    else
      printf "  \033[31m✗\033[0m %-38s %s\n" "denied: $label" "NOT DENIED — guardrail #1 breached"
      FAIL=1
    fi
  done
else
  printf "  \033[33m⋯\033[0m %-38s %s\n" "ai_readonly role" "not created (run seeder/roles/ai_readonly.sql)"
fi

echo "── ai service ──"
chk "ai container healthy" "$(docker inspect gym_ai_service --format '{{.State.Health.Status}}' 2>/dev/null)" "healthy"
HEALTH=$(curl -s --max-time 5 -w '\n%{http_code}' "http://127.0.0.1:8000/health" 2>/dev/null)
CODE=$(printf '%s' "$HEALTH" | tail -1)
BODY=$(printf '%s' "$HEALTH" | sed '$d')
if [ "$CODE" = "200" ]; then
  ok "/health 200" "$(printf '%s' "$BODY" | jq -c . 2>/dev/null)"
  chk "reports db up" "$(printf '%s' "$BODY" | jq -r .db 2>/dev/null)" "up"
else
  bad "/health" "HTTP ${CODE:-no response}"
fi

echo "── state volume (task 0.7a) ──"
# The AI service owns writable state at /data (SQLite: rate limits, checkpoints,
# document metadata). Two things have to hold at once, and they pull in opposite
# directions: the runtime user must be able to WRITE there, and must still not be
# able to write to its own code.
OWNER=$(docker compose exec -T ai stat -c '%U %a' /data 2>/dev/null | tr -d '\r')
chk "/data owned by the runtime user" "$OWNER" "appuser 755"
if docker compose exec -T ai sh -c 'touch /data/.verify && rm /data/.verify' >/dev/null 2>&1; then
  ok "/data is writable"
else
  bad "/data is writable" "a named volume is created root-owned; chown it in the Dockerfile before USER"
fi
if docker compose exec -T ai sh -c 'touch /app/app/evil' >/dev/null 2>&1; then
  bad "/app is NOT writable" "the runtime user can rewrite its own code"
  docker compose exec -T ai rm -f /app/app/evil >/dev/null 2>&1
else
  ok "/app is NOT writable"
fi
chk "SQLITE_PATH points into /data" \
    "$(docker compose exec -T ai sh -c 'case "$SQLITE_PATH" in /data/*) echo yes;; *) echo "$SQLITE_PATH";; esac' | tr -d '\r')" "yes"
if docker compose exec -T ai python -c "import aiosqlite" >/dev/null 2>&1; then
  ok "aiosqlite installed"
else
  bad "aiosqlite installed" "add it to requirements.txt and rebuild"
fi
# A named volume, not a bind mount: it must outlive `docker compose down`.
MOUNTS=$(docker inspect gym_ai_service --format '{{range .Mounts}}{{.Type}} {{.Destination}}{{println}}{{end}}')
case "$MOUNTS" in
  *"volume /data"*) ok "/data is a docker volume" ;;
  *) bad "/data is a docker volume" "state would be lost on \`compose down\`" ;;
esac

echo "── db layer (task 0.2) ──"
docker compose cp scripts/check_db_layer.py ai:/tmp/check_db_layer.py >/dev/null 2>&1
docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/check_db_layer.py || FAIL=1

echo "── tenant scoping + schema contract (tasks 0.3, 0.4) ──"
# Static guard, checked before the runtime tests: the engine's query functions are
# private and app/db/scope.py is their only caller. A match here means someone has a
# route to Postgres that carries no Scope -- the single failure this layer prevents.
# (main.py may still import the engine module: init/dispose/ping run no SQL of ours.)
LEAKS=$(grep -rn "_fetch_all\|_fetch_one" app/ --include='*.py' | grep -v "^app/db/" || true)
if [ -z "$LEAKS" ]; then
  ok "engine is reachable only from app/db/"
else
  bad "engine is reachable only from app/db/" "$(printf '%s' "$LEAKS" | head -3)"
fi
docker compose cp scripts/check_scope.py ai:/tmp/check_scope.py >/dev/null 2>&1
docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/check_scope.py || FAIL=1

echo "── auth: JWT + tenant resolution (task 0.5) ──"
docker compose cp scripts/check_auth.py ai:/tmp/check_auth.py >/dev/null 2>&1
docker compose cp scripts/mint_token.py ai:/tmp/mint_token.py >/dev/null 2>&1
docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/check_auth.py || FAIL=1

# A ban has to bite immediately. The AI service holds no session state, so a banned
# member keeps a perfectly valid signature until their token expires -- up to 15
# minutes of assistant access after the gym locked them out. Only the database
# lookup in tenancy.py closes that window, and only an end-to-end round trip proves
# it: same token before and after, nothing else changed.
mint() { docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/mint_token.py "$@" 2>/dev/null | tr -d '\r'; }
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 5 -H "Authorization: Bearer $1" \
         "http://127.0.0.1:8000/ai/me"; }
BAN_TOKEN=$(mint member Omar)
if [ -n "$BAN_TOKEN" ]; then
  chk "valid member token before the ban" "$(code "$BAN_TOKEN")" "200"
  q "update members set account_status='BANNED'::\"MemberAccountStatus\" where first_name='Omar'" >/dev/null
  chk "same token after the ban" "$(code "$BAN_TOKEN")" "401"
  q "update members set account_status='ACTIVE'::\"MemberAccountStatus\" where first_name='Omar'" >/dev/null
  chk "and works again once unbanned" "$(code "$BAN_TOKEN")" "200"
else
  bad "mint a member token" "mint_token.py produced nothing"
fi

echo "── internal API key + errors + logging (tasks 0.6, 0.8) ──"
docker compose cp scripts/check_api.py ai:/tmp/check_api.py >/dev/null 2>&1
docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/check_api.py || FAIL=1

# Secrets must not survive into a log file. Logs get tailed in demos, pasted into
# chats and shipped to whatever aggregator DevOps picks, so a token in a log line is
# a token in more places than the token store is. Exercise both credentials, then
# read the container's own output back and look for them.
API_KEY=$(grep '^INTERNAL_API_KEY=' .env | cut -d= -f2-)
LOG_TOKEN=$(mint member Omar)
curl -s -o /dev/null -H "Authorization: Bearer $LOG_TOKEN" http://127.0.0.1:8000/ai/me
curl -s -o /dev/null -H "X-API-Key: $API_KEY" http://127.0.0.1:8000/internal/ping
curl -s -o /dev/null -H "X-API-Key: wrong-key-abc123" http://127.0.0.1:8000/internal/ping
RECENT=$(docker compose logs ai --since 30s 2>&1)
case "$RECENT" in
  *"$LOG_TOKEN"*) bad "no JWT in the logs" "a bearer token was written to a log line" ;;
  *)              ok  "no JWT in the logs" ;;
esac
case "$RECENT" in
  *"$API_KEY"*)   bad "no API key in the logs" "INTERNAL_API_KEY was written to a log line" ;;
  *)              ok  "no API key in the logs" ;;
esac
case "$RECENT" in
  *"wrong-key-abc123"*) bad "no rejected key in the logs" "a near-miss key is most of a key" ;;
  *)                    ok  "no rejected key in the logs" ;;
esac
case "$RECENT" in
  *"app.access: GET /internal/ping -> 200"*) ok "access log records the request" ;;
  *) bad "access log records the request" "no access line for /internal/ping" ;;
esac

# CRLF in the URL, which lands verbatim in scope["path"]. In the development text
# format an unescaped newline there is a second, fabricated log line that can claim
# any status on any path.
curl -s -o /dev/null "http://127.0.0.1:8000/a%0d%0aINJECTED-BY-VERIFY -> 200"
FORGED=$(docker compose logs ai --since 15s 2>&1 | grep -c '^gym_ai_service  | INJECTED-BY-VERIFY' || true)
chk "a CRLF in the path forges no log line" "$FORGED" "0"

# Production emits one JSON object per line. Dev mode is human-readable, so this is
# the only way to see the format the graded artifact actually runs with.
PROD=$(docker compose -f docker-compose.yml run --rm --no-deps -e APP_ENV=production \
       --entrypoint python ai -c \
       "import app.main, logging; logging.getLogger('app').info('format probe')" \
       2>&1 | grep '"level"' | head -1)
if printf '%s' "$PROD" | jq -e '.level and .ts and .logger' >/dev/null 2>&1; then
  ok "production log lines are JSON" "$(printf '%s' "$PROD" | jq -c '{level,logger}')"
else
  bad "production log lines are JSON" "${PROD:-no JSON line produced}"
fi

echo "── rate limiter (task 0.7) ──"
docker compose cp scripts/check_ratelimit.py ai:/tmp/check_ratelimit.py >/dev/null 2>&1
docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/check_ratelimit.py || FAIL=1

# The counter has to outlive the process. An in-memory limiter (slowapi's default)
# resets on every deploy, which is a free way around it -- and would also reset per
# worker. check_ratelimit.py has just exhausted Omar's chat budget and spent one of
# Rachid's, so restarting and re-checking both proves persistence AND that the state
# is per subject, not a single global counter that happened to survive.
RL_OMAR=$(mint member Omar)
RL_RACHID=$(mint member Rachid)
rl() { curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
       -H "Authorization: Bearer $1" "http://127.0.0.1:8000/ai/rate-probe"; }
docker compose restart ai >/dev/null 2>&1
for i in $(seq 1 20); do
  [ "$(docker inspect gym_ai_service --format '{{.State.Health.Status}}' 2>/dev/null)" = "healthy" ] && break
  sleep 2
done
chk "exhausted budget survives a restart" "$(rl "$RL_OMAR")" "429"
chk "an unexhausted subject is unaffected" "$(rl "$RL_RACHID")" "200"

echo
[ $FAIL -eq 0 ] && echo "PASS" || echo "FAIL"
exit $FAIL
