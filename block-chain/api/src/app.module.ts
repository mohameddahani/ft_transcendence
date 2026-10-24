import { Module } from '@nestjs/common';
import { relayerModule } from './relayer/relayer.module.js';
import { RewardTokenSubModule } from './reward-token-sub/reward-token-sub.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [relayerModule, RewardTokenSubModule],
  controllers: [HealthController],
})
export class AppModule {}
