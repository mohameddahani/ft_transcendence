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
import { IsValidPassword } from '@/core/utils/password.validator';
import { Gender } from '@/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ example: 'Mohamed', description: 'User first name' }) // * Swagger Document
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
  @ApiProperty({ example: 'Dahani', description: 'User first name' }) // * Swagger Document
  lastName!: string;

  // * Gender
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(Gender)
  @ApiProperty({ enum: Gender, example: Gender.MALE }) // * Swagger Document
  gender!: Gender;

  // * Birth Date
  @Type(() => Date)
  @IsDate()
  @ApiProperty({ example: '1996-05-23', description: 'User Birth Date' }) // * Swagger Document
  birthDate!: Date;

  // * Email
  @IsEmail()
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'mohamed@gmail.com', description: 'User Email' }) // * Swagger Document
  email!: string;

  // * Password
  @IsString()
  @Validate(IsValidPassword)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'User Password' }) // * Swagger Document
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
  @ApiProperty({ example: '+212607080904', description: 'User Phone Number' }) // * Swagger Document
  phoneNumber!: string;

  // * Company Name
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'City Club', description: 'User Company Name' }) // * Swagger Document
  companyName!: string;

  // * Terms acceptance
  @IsBoolean()
  @ApiProperty({ example: true, description: 'User Terms Accepted' }) // * Swagger Document
  termsAccepted!: boolean;
}
