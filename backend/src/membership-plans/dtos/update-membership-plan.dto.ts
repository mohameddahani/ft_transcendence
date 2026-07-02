import { PartialType } from '@nestjs/mapped-types';
import { AddMembershipPlanDto } from './add-membership-plan.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMembershipPlanDto extends PartialType(AddMembershipPlanDto) {
  // * Is Active
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
