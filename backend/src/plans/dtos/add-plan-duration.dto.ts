import { IsNumber, IsPositive } from 'class-validator';

export class AddPlanDurationDto {
  // * Duration
  @IsNumber()
  @IsPositive()
  durationDays!: number;

  // * Price
  @IsNumber()
  @IsPositive()
  price!: number;
}
