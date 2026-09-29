# dev only: signs a token like the backend's, to test the AI service without the login page
# run from AI/:  docker compose exec -T ai python - <role> <who> [status] < scripts/mint_token.py
#   admin atlas | staff atlas | staff atlas BANNED | member omar@gmail.com
import sys
import time

import jwt

from app import config, db

role, who = sys.argv[1].upper(), sys.argv[2]
if role == "ADMIN":
    row = db.fetch_one("SELECT id FROM users WHERE role = 'ADMIN' AND company_name ILIKE %s",
                       (f"%{who}%",))
elif role == "STAFF":
    status = sys.argv[3].upper() if len(sys.argv) > 3 else "ACTIVE"
    row = db.fetch_one("""SELECT s.id FROM staffs s JOIN users u ON u.id = s.admin_id
                          WHERE u.company_name ILIKE %s AND s.account_status = %s""",
                       (f"%{who}%", status))
else:
    row = db.fetch_one("SELECT id FROM members WHERE email = %s", (who,))
if row is None:
    sys.exit(f"no {role} found for {who!r}")

now = int(time.time())
payload = {"id": row["id"], "role": role, "iat": now, "exp": now + 15 * 60}
print(jwt.encode(payload, config.JWT_SECRETS[role], algorithm="HS256"))
