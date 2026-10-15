import { Module } from '@nestjs/common';
import { rewardTokenSubController } from './reward-Token-Sub.controller.js';
import { rewardTokenSubService } from './reward-Token-Sub.service.js';

@Module({
    controllers: [rewardTokenSubController],
    providers: [rewardTokenSubService]
})
export class RewardTokenSubModule {}
