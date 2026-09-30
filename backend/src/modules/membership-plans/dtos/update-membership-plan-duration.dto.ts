import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class UpdateMembershipPlanDurationDto {
  // * MembershipId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd157',
    description: 'Membership Plan id',
  }) // * Swagger Document
  membershipPlanId!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiProperty({ example: 60, description: 'Duration Days' }) // * Swagger Document
  durationDays?: number;

  // * Price
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiProperty({ example: 300, description: 'Price' }) // * Swagger Document
  price?: number;
}
