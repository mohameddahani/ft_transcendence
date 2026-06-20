import { IsNumber, IsPositive } from 'class-validator';

export class AddMemebershipPlanDurationDto {
  // * Duration
  @IsNumber()
  @IsPositive()
  durationDays!: number;

  // * Price
  @IsNumber()
  @IsPositive()
  price!: number;
}
