import { PartialType } from '@nestjs/swagger';
import { AddPlanDto } from './add-plan.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePlanDto extends PartialType(AddPlanDto) {
  // * Is Active
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
