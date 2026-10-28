import { Module } from '@nestjs/common';
import { rewardTokenSubController } from './reward-Token-Sub.controller.js';
import { rewardTokenSubService } from './reward-Token-Sub.service.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [rewardTokenSubController],
  providers: [rewardTokenSubService],
  imports: [JwtModule.register({})],
})
export class RewardTokenSubModule {}
