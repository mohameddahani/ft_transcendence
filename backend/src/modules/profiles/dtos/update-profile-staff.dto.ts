import { IsValidPassword } from '@/core/utils/password.validator';
import { AddStaffDto } from '@/modules/staffs/dtos/add-staff.dto';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Validate } from 'class-validator';

export class UpdateProfileStaffDto extends PartialType(
  PickType(AddStaffDto, ['email', 'phoneNumber'] as const),
) {
  // * Password
  @IsOptional()
  @IsString()
  @Validate(IsValidPassword)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'Staff Password' }) // * Swagger Document
  password?: string;
}
