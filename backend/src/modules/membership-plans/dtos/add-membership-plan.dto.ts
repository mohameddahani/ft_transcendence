import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
