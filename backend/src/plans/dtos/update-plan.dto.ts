import { PartialType } from '@nestjs/mapped-types';
import { AddPlanDto } from './add-plan.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePlanDto extends PartialType(AddPlanDto) {
  // * Is Active
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
