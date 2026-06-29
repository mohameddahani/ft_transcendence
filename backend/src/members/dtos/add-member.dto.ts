import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsEnum,
  IsDate,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '@/generated/prisma/enums';

export class AddMemeberDto {
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

  // * Address
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  address!: string;

  // * Emergency Contact
  @IsPhoneNumber(undefined) // supports international format
  // ? \s → any whitespace (space, tab, newline)
  // ? + → one or more
  // ? g → global (all matches)
  // it removes ALL spaces anywhere in the string
  @Transform(({ value }): string =>
    typeof value === 'string' ? value?.replace(/\s+/g, '') : value,
  )
  emergencyContact!: string;

  // * Membership plan id
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  membershipPlanId!: string;

  // * DurationId
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  durationId!: string;

  // ! This for payment
  // * Note
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  note!: string;
}
