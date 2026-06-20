import { IsNumber, IsPositive, IsString } from 'class-validator';

export class AddPlanDurationDto {
  // * PlanId
  @IsString()
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
