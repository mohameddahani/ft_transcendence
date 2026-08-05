import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class UpdatePlanDurationDto {
  // * PlanId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd170',
    description: 'Plan id',
  }) // * Swagger Document
  planId!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiProperty({
    example: 60,
    description: 'Duration Days',
  }) // * Swagger Document
  durationDays?: number;

  // * Price
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiProperty({
    example: 500,
    description: 'Price',
  }) // * Swagger Document
  price?: number;
}
