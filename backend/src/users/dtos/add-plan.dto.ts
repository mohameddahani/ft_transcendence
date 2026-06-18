import {
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddPlanDto {
  // * Name
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  // * Price
  @IsNumber()
  @IsPositive()
  price!: number;

  // * Max Members
  @IsNumber()
  @IsPositive()
  maxMembers!: number;
}
