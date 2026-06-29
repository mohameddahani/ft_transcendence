import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class AddPlanDurationDto {
  // * PlanId
  @IsUUID()
  planId!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  durationDays!: number;

  // * Price
  @IsNumber()
  @IsPositive()
  price!: number;
}
