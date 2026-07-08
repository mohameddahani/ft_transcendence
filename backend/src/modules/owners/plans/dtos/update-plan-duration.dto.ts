import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class UpdatePlanDurationDto {
  // * PlanId
  @IsUUID()
  planId!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  @IsOptional()
  durationDays?: number;

  // * Price
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
}
