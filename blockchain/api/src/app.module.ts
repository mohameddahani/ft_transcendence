import { Module } from '@nestjs/common';
import { relayerModule } from './relayer/relayer.module.js';
import { RewardTokenSubModule } from './reward-token-sub/reward-token-sub.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [relayerModule, RewardTokenSubModule, PrismaModule, ConfigModule.forRoot({
    isGlobal: true,
  })],
  controllers: [HealthController],
})
export class AppModule {}
