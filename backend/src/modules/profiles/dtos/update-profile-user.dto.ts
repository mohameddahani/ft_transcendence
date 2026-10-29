import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { RegisterUserDto } from '../../auth/dtos/register-user.dto';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileUserDto extends PartialType(
  OmitType(RegisterUserDto, ['email', 'termsAccepted'] as const),
) {
  // * Current Password
  @IsOptional()
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'Current Password' }) // * Swagger Document
  currentPassword?: string;
}
