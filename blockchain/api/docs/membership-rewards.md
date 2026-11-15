# Membership rewards

The backend's existing PostgreSQL database contains `public.membership_rewards`:

| Column | Meaning |
| --- | --- |
| `membership_id` (UUID primary key) | Purchased membership ID, unique for each registration/renewal |
| `rewarded` (boolean, default false) | True after the reward has three chain confirmations |

Backend migrations own the table and its protection trigger. DevOps creates the dedicated `blockchain_rewards_app` login. The blockchain API uses `PrismaService` and its own one-model Prisma client, with no direct pg queries, new application database, foreign key, queue, or automatic retry. The backend sends its HTTP request after committing the membership/payment and does not wait for the reward response.

## Request and duplicate protection

```http
POST /blockchain/rewardClient
Content-Type: application/json
X-Reward-Secret: <server-only shared secret>

{"membershipId":"<purchased membership UUID>","clientWallet":"0x..."}
```

The backend must verify the payment and the member's wallet. Member/admin JWTs do not authorize this endpoint. Keep the secret out of browser code.

1. Prisma `createMany` with `skipDuplicates` atomically reserves the ID with `rewarded=false`. Only the winning insertion can send a reward. This reservation commits before any blockchain call.
2. Every existing ID is skipped, whether its flag is true or false. Concurrent duplicates return `alreadyExists`, not a unique-constraint error.
3. A PostgreSQL advisory lock, acquired through a Prisma transaction, serializes use of the owner wallet across API replicas. Lock acquisition waits up to two minutes so a normal three-confirmation reward can finish before the next one starts. The lock transaction has a six-minute limit, including lock acquisition and RPC/confirmation time, instead of Prisma's default five seconds.
4. The owner-signed forwarder sends 3 G. RPC requests have a ten-second timeout; transaction confirmation waits for three confirmations, for at most sixty seconds.
5. Prisma updates only an unconfirmed row to true. The successful response includes the transaction hash.

The DB login has SELECT, INSERT and column-level UPDATE(rewarded) on this table only, plus schema usage and database connection. It cannot access member tables, delete/truncate rewards, change membership IDs or manage schema objects. The trigger rejects initially confirmed rows and changing confirmed records. Database administrators remain privileged.

## Configuration and startup

In `devops/.env`:

```dotenv
REWARDS_DB_USER=blockchain_rewards_app
REWARDS_DB_PASSWORD=<generate with openssl rand -hex 32>
```

Use a URL-safe password because Compose builds the connection URL. Compose uses the existing `POSTGRES_DB`: backend migration → `rewards-db-setup` grants → blockchain API startup. Setup works with existing database volumes and fails if the rewards role inherits unexpected access to other application tables. The migration preserves existing reward rows.

Compose sets `REWARDS_DATABASE_URL` automatically. Outside Compose, set it in `blockchain/api/.env` to the same backend database using the restricted login, for example:

```dotenv
REWARDS_DATABASE_URL=postgresql://blockchain_rewards_app:<url-encoded-password>@<host>:5432/testing_db?schema=public
```

The API also needs `REWARD_INTERNAL_SECRET` (at least 32 characters), `REWARD_OWNER_PRIVATE_KEY`, `SEPOLIA_RPC_URL`, `GYMTOKEN_ADDRESS` and `FORWARDER_ADDRESS`. Reserve the owner wallet for rewards; the generic relayer uses a different `RELAYER_PRIVATE_KEY`. Backend configuration uses the same `REWARD_INTERNAL_SECRET` and `BLOCKCHAIN_REWARD_API_URL=http://blockchain:3000/blockchain/rewardClient`.

`npm run build` generates the ESM Prisma client before compiling. Generation needs no database credentials or network connection to PostgreSQL. `npm run start:dev` also generates the client. The schema filename is `prisma/shema.prisma`, matching `prisma.config.ts`.

Only backend migrations manage tables. Do not run `prisma migrate` or `prisma db push` from the blockchain API: its one-model schema describes only its permitted table in the shared database.

## Failures and manual review

A claim/database-check failure returns 503 without sending a blockchain reward. Retrying must use the same membership ID. A send or confirmation failure leaves the committed row false and blocks further attempts. If the chain confirmed but the flag update failed, the response explicitly says so and includes the confirmed transaction hash. Logs identify the stage and retain a sanitized error reason.

`rewarded=false` means reserved, not safe to send again: a transaction may still be pending or may have succeeded without the process receiving confirmation. Check transaction logs and the chain before manual action. Never reset/delete a row or create a new membership ID to bypass it. Restoring a stale database backup can also allow duplicate rewards. Keep reward history in backend database backups.

## Verification

From `blockchain/api`, run `npm ci` followed by `npm run test:rewards` with Docker available. The test creates a disposable PostgreSQL container, applies the real migration and restricted-role grants, and starts two real Nest HTTP servers. Only blockchain sending is mocked. It checks authorization, concurrent duplicates, wallet locking across replicas, failed claims/sends/flag updates, waits longer than five seconds, immutable history, restricted permissions and preservation of existing rows. It never contacts the application database or sends real blockchain transactions.
