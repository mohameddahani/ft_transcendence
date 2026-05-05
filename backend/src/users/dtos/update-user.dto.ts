import { IsEmail, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  // * Email
  @IsEmail()
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  email!: string;

  // * Password
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  password!: string;
}
