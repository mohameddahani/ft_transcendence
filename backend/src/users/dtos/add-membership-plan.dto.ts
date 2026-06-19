import { MembershipDuration } from '@/generated/prisma/enums';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddMemebershipPlanDto {
  // * Duration
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(MembershipDuration)
  duration!: MembershipDuration;

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
