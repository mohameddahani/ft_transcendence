// Disposable PostgreSQL + real Nest HTTP endpoints. Chain sending is mocked;
// this test never connects to the application's database or sends G tokens.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const container = `rewards-review-test-${process.pid}`;
const docker = (args, input) =>
  execFileSync('docker', args, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
const sql = (input) =>
  docker(
    [
      'exec',
      '-i',
      container,
      'psql',
      '-X',
      '-U',
      'postgres',
      '-d',
      'rewards_test',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    input,
  );
const migration = readFileSync(
  `${root}/backend/prisma/migrations/20261114000000_membership_rewards/migration.sql`,
  'utf8',
);
const setup = () =>
  docker([
    'exec',
    '-e',
    'PGHOST=127.0.0.1',
    '-e',
    'PGPASSWORD=test-admin-password',
    '-e',
    'REWARDS_DB_USER=blockchain_rewards_app',
    '-e',
    'REWARDS_DB_PASSWORD=test-rewards-password',
    container,
    'sh',
    '/rewards/setup-rewards.sh',
  ]);
const apps = [];
try {
  docker([
    'run',
    '-d',
    '--name',
    container,
    '-e',
    'POSTGRES_USER=postgres',
    '-e',
    'POSTGRES_PASSWORD=test-admin-password',
    '-e',
    'POSTGRES_DB=rewards_test',
    '-p',
    '127.0.0.1::5432',
    '-v',
    `${root}/devops/postgres:/rewards:ro`,
    'postgres:16-alpine',
  ]);
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      sql('SELECT 1;');
      ready = true;
      break;
    } catch {
      await delay(500);
    }
  }
  assert.ok(ready, 'Disposable PostgreSQL must start');
  sql(migration);
  sql('CREATE TABLE public.members (id uuid PRIMARY KEY);');
  setup();
  setup(); // Reapplying grants must not widen access.
  const port = docker(['port', container, '5432/tcp']).trim().split(':').at(-1);
  Object.assign(process.env, {
    REWARDS_DATABASE_URL: `postgresql://blockchain_rewards_app:test-rewards-password@127.0.0.1:${port}/rewards_test`,
    REWARD_INTERNAL_SECRET: 'test-secret-that-is-at-least-32-characters',
    SEPOLIA_RPC_URL: 'http://127.0.0.1:1',
    REWARD_OWNER_PRIVATE_KEY: '1'.repeat(64),
    RELAYER_PRIVATE_KEY: '',
    GYMTOKEN_ADDRESS: '0x' + '11'.repeat(20),
    FORWARDER_ADDRESS: '0x' + '22'.repeat(20),
  });
  // Import only after test configuration overrides any local .env values.
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../dist/app.module.js');
  const { PrismaService } = await import('../dist/prisma/prisma.service.js');
  const { rewardTokenSubService } =
    await import('../dist/reward-token-sub/reward-Token-Sub.service.js');
  const sends = new Map();
  const failChain = new Set();
  let active = 0;
  let peak = 0;
  for (let i = 0; i < 2; i++) {
    const app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    apps.push(app);
    const prisma = app.get(PrismaService);
    app.get(rewardTokenSubService).sendReward = async (id) => {
      assert.equal(
        (
          await prisma.membershipReward.findUniqueOrThrow({
            where: { membershipId: id },
          })
        ).rewarded,
        false,
      );
      sends.set(id, (sends.get(id) ?? 0) + 1);
      active++;
      peak = Math.max(peak, active);
      try {
        await delay(75);
        if (failChain.has(id))
          throw Object.assign(new Error('Mock chain timeout'), {
            code: 'TIMEOUT',
          });
        return '0x' + id.replaceAll('-', '').padEnd(64, '0');
      } finally {
        active--;
      }
    };
    await app.listen(0, '127.0.0.1');
  }
  const urls = await Promise.all(apps.map((app) => app.getUrl()));
  const prisma = apps[0].get(PrismaService);
  const service = apps[0].get(rewardTokenSubService);
  const send = async (
    id,
    replica = 0,
    secret = process.env.REWARD_INTERNAL_SECRET,
  ) => {
    const response = await fetch(`${urls[replica]}/blockchain/rewardClient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Reward-Secret': secret,
      },
      body: JSON.stringify({
        membershipId: id,
        clientWallet: '0x' + '33'.repeat(20),
      }),
    });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await send(randomUUID(), 0, 'invalid')).status, 401);
  assert.equal((await send('invalid-id')).status, 400);
  assert.equal(await prisma.membershipReward.count(), 0);

  const id = randomUUID();
  const responses = await Promise.all(
    Array.from({ length: 12 }, (_, i) => send(id, i % 2)),
  );
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal(
    responses.filter((response) => !response.body.alreadyExists).length,
    1,
  );
  assert.equal(sends.get(id), 1);
  const duplicate = await send(id);
  assert.equal(duplicate.body.rewarded, true);
  assert.equal(duplicate.body.alreadyExists, true);

  // Different memberships on different API replicas share the owner's nonce.
  const distinct = [randomUUID(), randomUUID()];
  const parallel = await Promise.all(distinct.map((key, i) => send(key, i)));
  assert.ok(
    parallel.every(
      (response) => response.status === 200 && response.body.rewarded,
    ),
  );
  assert.equal(peak, 1);

  const failed = randomUUID();
  failChain.add(failed);
  assert.equal((await send(failed)).status, 503);
  const retry = await send(failed);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.rewarded, false);
  assert.equal(retry.body.alreadyExists, true);
  assert.equal(sends.get(failed), 1);

  const originalCreate = service.create.bind(service);
  service.create = async () => {
    throw new Error('Mock DB unavailable');
  };
  const unclaimed = randomUUID();
  const claimFailure = await send(unclaimed);
  service.create = originalCreate;
  assert.equal(claimFailure.status, 503);
  assert.match(claimFailure.body.message, /No blockchain reward was sent/);
  assert.equal(
    await prisma.membershipReward.findUnique({
      where: { membershipId: unclaimed },
    }),
    null,
  );
  assert.equal(sends.has(unclaimed), false);

  const originalUpdate = service.update.bind(service);
  service.update = async () => {
    throw new Error('Mock DB confirmation failure');
  };
  const unconfirmed = randomUUID();
  const confirmationFailure = await send(unconfirmed);
  service.update = originalUpdate;
  assert.equal(confirmationFailure.status, 503);
  assert.match(confirmationFailure.body.message, /confirmed on-chain/);
  assert.ok(confirmationFailure.body.hash);
  assert.equal((await send(unconfirmed)).body.alreadyExists, true);
  assert.equal(sends.get(unconfirmed), 1);

  // A usual chain wait must not expire Prisma's default five-second timeout.
  const originalSend = service.sendReward.bind(service);
  let signalStarted;
  const started = new Promise((resolve) => {
    signalStarted = resolve;
  });
  service.sendReward = async (key) => {
    signalStarted();
    await delay(5500);
    return originalSend(key);
  };
  const slowReward = send(randomUUID());
  await started;
  const waitingReward = send(randomUUID(), 1);
  assert.ok(
    (await Promise.all([slowReward, waitingReward])).every(
      (response) => response.status === 200,
    ),
  );
  service.sendReward = originalSend;

  for (const statement of [
    'SELECT * FROM public.members',
    'DELETE FROM public.membership_rewards',
    'TRUNCATE public.membership_rewards',
    'CREATE TABLE public.unwanted (id int)',
    'UPDATE public.membership_rewards SET membership_id = gen_random_uuid()',
  ]) {
    await assert.rejects(
      prisma.$executeRawUnsafe(statement),
      /permission denied|must be owner/,
    );
  }
  await assert.rejects(
    prisma.$executeRaw`UPDATE public.membership_rewards SET rewarded = false WHERE membership_id = ${id}::uuid`,
    /cannot be changed/,
  );
  await assert.rejects(
    prisma.$executeRaw`INSERT INTO public.membership_rewards VALUES (${randomUUID()}::uuid, true)`,
    /must start unconfirmed/,
  );
  const before = await prisma.membershipReward.findMany({
    orderBy: { membershipId: 'asc' },
  });
  sql(migration); // Existing-table upgrades preserve confirmed and pending IDs.
  assert.deepEqual(
    await prisma.membershipReward.findMany({
      orderBy: { membershipId: 'asc' },
    }),
    before,
  );
  sql('GRANT SELECT(id) ON public.members TO PUBLIC;');
  assert.throws(setup);
  sql('REVOKE SELECT(id) ON public.members FROM PUBLIC;');
  setup();
  console.log(
    'Passed: Nest startup, HTTP auth, concurrent duplicate claims, owner locking across replicas, failure handling, long confirmation waits, restricted privileges, and history preservation.',
  );
} finally {
  await Promise.all(apps.map((app) => app.close()));
  docker(['rm', '-f', '-v', container]);
}
