This is a simple process about corrupting or wiping the DB, then restore and verify the data came back.
---

### Step 1 — make sure you have a backup first:
```bash
docker compose exec backup backup.sh
ls -lh backups/
```

### Step 2 — note some real data in the DB so you can verify it came back:
```bash
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"
# pick any table and count its rows
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM users;"
```

### Step 3 — destroy some data (simulate disaster):
```bash
# Option A — drop a table
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "DROP TABLE users;"

# Option B — nuke the whole database (more dramatic, proves full recovery)
docker compose exec postgres psql -U $POSTGRES_USER -U $POSTGRES_USER -d postgres -c "DROP DATABASE $POSTGRES_DB;"
```

### Step 4 — restore:
```bash
docker compose exec backup restore.sh
# or with a specific file:
docker compose exec backup restore.sh /backups/gymflow_20261014_020000.dump
```

### Step 5 — verify data is back:
```bash
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM users;"
```
The count should match what you noted in Step 2. If it does, your backup/restore cycle is proven end-to-end.