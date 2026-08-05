import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ActiveSubscriptionDto {
  // * PlanId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd255',
    description: 'Plan id',
  }) // * Swagger Document
  planId!: string;

  // * DurationId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd151',
    description: 'Plan Duration id',
  }) // * Swagger Document
  planDurationId!: string;

  // * Username
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({
    example: 'zakaria-khaldoune-xyz',
    description: 'User Name of Admin',
  }) // * Swagger Document
  userName!: string;
}
