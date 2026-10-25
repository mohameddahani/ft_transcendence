import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  // * Check the redis is work when the module is init
  async onModuleInit() {
    const key = `diagnostic:cache:${randomUUID()}`;

    const expectedValue = 'Redis is working';

    await this.cache.set(key, expectedValue, 60_000);

    const actualValue = await this.cache.get<string>(key);

    if (actualValue !== expectedValue) {
      throw new Error('Redis cache read/write check failed');
    }

    this.logger.log('Redis cache read/write check passed');

    await this.cache.del(key);
  }
}
