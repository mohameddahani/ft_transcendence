import { IsValidPassword } from '@/core/utils/password.validator';
import { Transform } from 'class-transformer';
import { IsString, Validate } from 'class-validator';

export class SetPasswordMemberDto {
  // * Password
  @IsString()
  @Validate(IsValidPassword)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  password!: string;
}
