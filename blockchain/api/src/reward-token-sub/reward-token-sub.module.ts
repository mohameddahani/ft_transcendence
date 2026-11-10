import { Module } from '@nestjs/common';
import { rewardTokenSubController } from './reward-Token-Sub.controller.js';
import { rewardTokenSubService } from './reward-Token-Sub.service.js';
import { MembershipRewardsStore } from './membership-rewards.store.js';

@Module({
  controllers: [rewardTokenSubController],
  providers: [MembershipRewardsStore, rewardTokenSubService],
})
export class RewardTokenSubModule {}
