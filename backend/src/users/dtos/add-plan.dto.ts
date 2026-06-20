import {
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddPlanDto {
  // * Plan Name
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  planName!: string;

  // * Price
  @IsNumber()
  @IsPositive()
  price!: number;

  // * Max Members
  @IsNumber()
  @IsPositive()
  maxMembers!: number;

  // * Duration
  @IsNumber()
  @IsPositive()
  durationDays!: number;
}
