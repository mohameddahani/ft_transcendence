import { IsValidPassword } from '@/core/utils/password.validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Validate } from 'class-validator';

export class SetPasswordStaffDto {
  // * Password
  @IsString()
  @Validate(IsValidPassword)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'Staff Password' }) // * Swagger Document
  password!: string;
}
