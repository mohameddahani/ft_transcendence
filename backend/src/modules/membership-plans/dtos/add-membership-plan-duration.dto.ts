import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class AddMembershipPlanDurationDto {
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
  durationDays!: number;

  // * Price
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    example: 200,
    description: 'Price',
  }) // * Swagger Document
  price!: number;

  // * priceByG
  @IsInt()
  @IsPositive()
  @ApiProperty({
    example: 50,
    description: 'Price in G',
  })
  priceByG!: number;
}
