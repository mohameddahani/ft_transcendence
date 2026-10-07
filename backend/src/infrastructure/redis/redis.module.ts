import { Logger, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';

@Module({
  providers: [RedisService],
  imports: [
    CacheModule.registerAsync({
      // * Make the configured cache providers available application-wide.
      isGlobal: true,

      // * Ask Nest to supply ConfigService to the factory.
      inject: [ConfigService],

      // * Build the cache configuration during initialization.
      useFactory: (config: ConfigService) => {
        // * Label logs produced by this configuration.
        const logger = new Logger('Redis-Cache');

        // * Read the Redis address and create a Redis-backed Keyv store.
        const store = createKeyv(config.getOrThrow<string>('REDIS_URL'));

        // * Register a callback for store error events.
        store.on('error', (error: Error) => {
          logger.error(error.message);
        });

        // * Return settings for the cache manager.
        return {
          // * Use this single Redis-backed store.
          stores: [store],

          // * Default entry lifetime: 60 seconds, expressed in milliseconds.
          ttl: 60_000,
        };
      },
    }),
  ],
})
export class RedisModule {}
