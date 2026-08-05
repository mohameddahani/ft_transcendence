import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AddMembershipPlanDto } from './add-membership-plan.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMembershipPlanDto extends PartialType(AddMembershipPlanDto) {
  // * Is Active
  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'is this membership plan active',
  }) // * Swagger Document
  isActive?: boolean;
}
