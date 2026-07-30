import {
  IsNumber,
  IsOptional,
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

  // * Max Members
  @IsNumber()
  @IsPositive()
  maxMembers!: number;

  // * Description
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  description!: string;
}
