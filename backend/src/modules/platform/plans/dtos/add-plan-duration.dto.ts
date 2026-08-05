import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class AddPlanDurationDto {
  // * PlanId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd160',
    description: 'Plan Duration id',
  }) // * Swagger Document
  planId!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    example: 180,
    description: 'Days of Plan',
  }) // * Swagger Document
  durationDays!: number;

  // * Price
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    example: 300,
    description: 'Price',
  }) // * Swagger Document
  price!: number;
}
