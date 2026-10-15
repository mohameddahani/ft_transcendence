import { Module } from '@nestjs/common';
import { relayerModule } from './relayer/relayer.module.js';
import { RewardTokenSubModule } from './reward-token-sub/reward-token-sub.module.js';

@Module({
  imports: [relayerModule, RewardTokenSubModule],
})
export class AppModule {}
