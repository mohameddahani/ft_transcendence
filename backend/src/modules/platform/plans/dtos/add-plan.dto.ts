import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddPlanDto {
  // * Plan Name
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({
    example: 'Pro',
    description: 'Name of Plan',
  }) // * Swagger Document
  planName!: string;

  // * Max Members
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    example: 500,
    description: 'Max Members of Plan',
  }) // * Swagger Document
  maxMembers!: number;

  // * Description
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty({
    example: 'This Plan Make You Add 500 Members ...',
    description: 'Description of plan',
  }) // * Swagger Document
  description!: string;
}
