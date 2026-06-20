import { Module } from '@nestjs/common';
import { MembershipPlanController } from './membership-plans.controller';
import { MembershipPlanService } from './membership-plans.service';

@Module({
  controllers: [MembershipPlanController],
  providers: [MembershipPlanService],
  imports: [],
  exports: [],
})
export class MembershipPlanModule {}
