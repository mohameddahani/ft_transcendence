import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddMemebershipPlanDto {
  // * Plan Name
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  planName!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  durationDays!: number;

  // * Price
  @IsNumber()
  @IsPositive()
  price!: number;

  // * Description
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  description!: string;
}
