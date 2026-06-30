import { PartialType } from '@nestjs/mapped-types';
import { AddMembershipPlanDto } from './add-membership-plan.dto';

export class UpdateMembershipPlanDto extends PartialType(
  AddMembershipPlanDto,
) {}
