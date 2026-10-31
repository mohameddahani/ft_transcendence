import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AddPlanDto } from './add-plan.dto';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdatePlanDto extends PartialType(AddPlanDto) {
  // * Is Active
  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({
    example: true,
    description: 'is this membership plan active',
  }) // * Swagger Document
  isActive?: boolean;
}
