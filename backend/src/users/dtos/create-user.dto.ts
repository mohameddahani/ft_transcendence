import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  IsPhoneNumber,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidPassword } from '@/utils/password.validator';

export class CreateUserDto {
  // * First Name
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // ? / ... /: This defines a regular expression
  // ? ^: Start from the beginning of the string
  // ? a-z → lowercase letters
  // ? A-Z → uppercase letters
  // ? - → hyphen
  // ? space " "
  // ? +: One or more of the allowed characters
  // ? $: End of the string
  @Matches(/^[a-zA-Z\- ]+$/, {
    message: 'First name can only contain letters, spaces, and hyphens',
  })
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstName!: string;

  // * Last Name
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z\- ]+$/, {
    message: 'Last name can only contain letters, spaces, and hyphens',
  })
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastName!: string;

  // * Username
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'Username can only contain lowercase letters, numbers, and underscores',
  })
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  userName!: string;

  // * Email
  @IsEmail()
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  email!: string;

  // * Password
  @IsString()
  @Validate(IsValidPassword)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  password!: string;

  // * Phone Number
  @IsPhoneNumber(undefined) // supports international format
  // ? \s → any whitespace (space, tab, newline)
  // ? + → one or more
  // ? g → global (all matches)
  // it removes ALL spaces anywhere in the string
  @Transform(({ value }): string =>
    typeof value === 'string' ? value?.replace(/\s+/g, '') : value,
  )
  phoneNumber!: string;

  // * Terms acceptance
  @IsBoolean()
  termsAccepted!: boolean;
}
