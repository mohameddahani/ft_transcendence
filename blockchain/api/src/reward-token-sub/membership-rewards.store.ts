import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';

// Exactly two columns. No backend tables, foreign keys, or relation to Prisma.
export const MEMBERSHIP_REWARDS_SQL = `
CREATE SCHEMA IF NOT EXISTS blockchain;
CREATE TABLE IF NOT EXISTS blockchain.membership_rewards (
  membership_id UUID PRIMARY KEY,
  rewarded BOOLEAN NOT NULL DEFAULT false
);
CREATE OR REPLACE FUNCTION blockchain.protect_membership_reward() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Reward records cannot be deleted'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.rewarded THEN RAISE EXCEPTION 'Rewards must start unconfirmed'; END IF;
  ELSIF NEW.membership_id IS DISTINCT FROM OLD.membership_id OR OLD.rewarded THEN
    RAISE EXCEPTION 'Reward identity and confirmed rewards cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS membership_reward_guard ON blockchain.membership_rewards;
CREATE TRIGGER membership_reward_guard BEFORE INSERT OR UPDATE OR DELETE ON blockchain.membership_rewards
  FOR EACH ROW EXECUTE FUNCTION blockchain.protect_membership_reward();
`;

@Injectable()
export class MembershipRewardsStore implements OnModuleInit, OnModuleDestroy {
  private pool?: Pool;

  async onModuleInit() {
    if (!process.env.REWARDS_DATABASE_URL) return;
    this.pool = new Pool({
      connectionString: process.env.REWARDS_DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
    });
    this.pool.on('error', () => {
      /* The pool replaces failed idle connections. */
    });
    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(71482040)');
      await client.query(MEMBERSHIP_REWARDS_SQL);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private database() {
    if (!this.pool)
      throw new ServiceUnavailableException(
        'Reward database is not configured',
      );
    return this.pool;
  }

  async claim(membershipId: string) {
    // Autocommit BEFORE contacting the chain. Only the INSERT winner may mint.
    const inserted = await this.database().query(
      `INSERT INTO blockchain.membership_rewards (membership_id) VALUES ($1)
       ON CONFLICT (membership_id) DO NOTHING RETURNING membership_id`,
      [membershipId],
    );
    if (inserted.rowCount === 1) return { inserted: true, rewarded: false };
    const existing = await this.database().query<{ rewarded: boolean }>(
      'SELECT rewarded FROM blockchain.membership_rewards WHERE membership_id = $1',
      [membershipId],
    );
    return { inserted: false, rewarded: existing.rows[0].rewarded };
  }

  // Serialize rewards for different memberships using the same owner's nonce.
  async withOwnerLock<T>(work: () => Promise<T>): Promise<T> {
    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL lock_timeout = 5000');
      await client.query('SELECT pg_advisory_xact_lock(71482041)');
      const result = await work();
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async confirm(membershipId: string) {
    await this.database().query(
      'UPDATE blockchain.membership_rewards SET rewarded = true WHERE membership_id = $1 AND rewarded = false',
      [membershipId],
    );
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
