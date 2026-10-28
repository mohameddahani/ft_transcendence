import { IsValidPassword } from '@/core/utils/password.validator';
import { AddMemberDto } from '@/modules/members/dtos/add-member.dto';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Validate } from 'class-validator';

export class UpdateProfileMemberDto extends PartialType(
  PickType(AddMemberDto, [
    'email',
    'phoneNumber',
    'address',
    'emergencyContact',

    // ! BLOCK_CHAINE
    'walletAddress',
  ] as const),
) {
  // * Password
  @IsOptional()
  @IsString()
  @Validate(IsValidPassword)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'Member Password' }) // * Swagger Document
  password?: string;

  // * Current Password
  @IsOptional()
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'Current Password' }) // * Swagger Document
  currentPassword?: string;
}
