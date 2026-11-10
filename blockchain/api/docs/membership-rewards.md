# Simple membership rewards

The blockchain API owns `blockchain.membership_rewards`, with exactly two columns:

| Column | Meaning |
| --- | --- |
| `membership_id` (UUID primary key) | The purchased membership's ID, not the shared plan ID or member ID |
| `rewarded` (boolean, initially false) | True only after the reward transaction has three confirmations |

There is no backend reward table, foreign key, cron job, delivery queue, or automatic retry. The backend makes one direct HTTP request after committing a new member's cash membership/payment or a cash renewal. A reward problem never rolls back that purchase. Existing historical memberships are not backfilled. A member without a wallet is skipped and needs a manual request after the wallet is available.

## Request

Only trusted server code should call:

```http
POST /blockchain/rewardClient
Content-Type: application/json
X-Reward-Secret: <server-only shared secret>

{"membershipId":"<purchased membership UUID>","clientWallet":"0x..."}
```

The backend is responsible for verifying that the membership was paid and that the wallet belongs to its member. An admin/member JWT does not authorize this endpoint. Never expose the secret in a `NEXT_PUBLIC_` variable or frontend code.

An atomic `INSERT ... ON CONFLICT DO NOTHING` reserves the ID with `rewarded=false` before any chain call. Only the request that inserts the row sends 3 whole G through the owner-signed forwarder. Every existing ID is skipped, whether true or false. The API updates the flag to true after confirmation. Database triggers prevent changing a confirmed record, changing its ID, or deleting reward records. There is no reset endpoint.

Successful response: `{membershipId, rewarded:true, alreadyExists:false, hash}`. An existing row returns `{membershipId, rewarded, alreadyExists:true, message}`. A failed/uncertain new attempt returns HTTP 503 and leaves the row false. New renewals use new membership IDs and can receive their own reward.

## Configuration

In `blockchain/api/.env`:

- `REWARDS_DATABASE_URL`: PostgreSQL connection for this API's database. It can use a separate database on the existing PostgreSQL server. The login must be able to create the `blockchain` schema, table and trigger. The API initializes these on startup; no backend Prisma migration is involved.
- `REWARD_INTERNAL_SECRET`: a random secret of at least 32 characters, matching the backend. Generate one locally, for example with `openssl rand -hex 32`.
- `REWARD_OWNER_PRIVATE_KEY`: the GymToken contract owner's wallet, with Sepolia ETH for gas. Reserve this wallet for rewards; use a different wallet for the public relayer's `RELAYER_PRIVATE_KEY`.
- Existing `SEPOLIA_RPC_URL`, `GYMTOKEN_ADDRESS`, and `FORWARDER_ADDRESS` must match the deployed Sepolia contracts.

In `backend/.env`:

- `BLOCKCHAIN_INTERNAL_URL=http://blockchain:3000` when running in Compose.
- `REWARD_INTERNAL_SECRET`: the same shared secret.

Configure both services before accepting purchases. Rebuild/recreate the `backend` and `blockchain` services. No new public Nginx route or published container port is needed. Back up the API's reward database: deleting or restoring stale reward history can allow duplicate rewards. A database superuser can bypass database protections.

## Deliberate limitation of the two-column design

`rewarded=false` means reserved, not safe to send again. The process might still be working, might have failed before submission, or might have sent the reward and lost the response. This design prioritizes preventing duplicate attempts; it cannot automatically recover missed rewards. The API logs the membership ID and transaction hash as soon as the RPC returns a hash. Check those logs, the owner's transactions and the chain before any manual action. Do not delete/reset a row or create a new membership ID to bypass it.

The backend waits up to five seconds for the HTTP response; the blockchain API may continue processing after that timeout. A disconnected request or missing configuration can also mean no reward request reached the API. There is no automatic retry. After checking the outcome, resending the SAME membership ID is safe against duplicate attempts: an existing row is always skipped. Never infer successful minting merely from a row's existence.

This change connects the existing cash registration/renewal flows. It does not turn a G-token transfer into a verified backend membership purchase. A G-payment confirmation handler must first verify the chain payment and save a membership, then call this same endpoint with that membership's ID.

## Checks

Use fresh disposable databases only:

- From `blockchain/api`, install dependencies, run `npm run build`, then `REWARDS_DATABASE_URL=<test database> node test/simple-rewards.integration.mjs`. This tests the actual internal HTTP endpoint and PostgreSQL constraints with mocked chain sending.
- From `backend`, set `DATABASE_URL=<test database>`, run `npx prisma migrate deploy`, `npx prisma generate`, `npm run build`, then `node test/simple-membership-rewards.integration.cjs`. It checks initial registration, expired renewal, distinct IDs and post-commit HTTP delivery. HTTP is mocked.

Neither check spends real tokens or gas.
