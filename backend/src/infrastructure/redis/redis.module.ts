import { Logger, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';

@Module({
  providers: [RedisService],
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,

      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('Redis-Cache');

        const store = createKeyv(config.getOrThrow<string>('REDIS_URL'));

        store.on('error', (error: Error) => {
          logger.error(error.message);
        });

        return {
          stores: [store],
          ttl: 60_000,
        };
      },
    }),
  ],
})
export class RedisModule {}
