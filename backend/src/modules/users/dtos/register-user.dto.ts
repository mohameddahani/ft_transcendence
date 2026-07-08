import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  IsPhoneNumber,
  Validate,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsValidPassword } from '@/utils/password.validator';
import { Gender } from '@/generated/prisma/enums';

export class RegisterUserDto {
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

  // * Gender
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(Gender)
  gender!: Gender;

  // * Birth Date
  @Type(() => Date)
  @IsDate()
  birthDate!: Date;

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

  // * Company Name
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  companyName!: string;

  // * Terms acceptance
  @IsBoolean()
  termsAccepted!: boolean;
}
