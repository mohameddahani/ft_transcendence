import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AddMembershipPlanDto {
  // * Plan Name
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({
    example: 'Basic',
    description: 'Membership Plan Name',
  }) // * Swagger Document
  planName!: string;

  // * Description
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty({
    example: 'You Have Authorisation to use only Basic Machines',
    description: 'Membership Plan Description',
  }) // * Swagger Document
  description!: string;

  // * weekly Visit Limit
  @IsInt()
  @Min(1)
  @Max(7)
  @ApiProperty({
    example: 3,
    description: 'Maximum number of visits a member can make per week.',
    minimum: 1,
    maximum: 7,
  })
  weeklyVisitLimit!: number;
}
