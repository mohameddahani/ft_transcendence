import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsEnum,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '@/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
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
  @ApiProperty({ example: 'Ayman', description: 'Member first name' }) // * Swagger Document
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
  @ApiProperty({ example: 'El Jamaaouy', description: 'Member last name' }) // * Swagger Document
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
  @ApiProperty({ example: '1996-05-23', description: 'Member Birth Date' }) // * Swagger Document
  birthDate!: Date;

  // * Email
  @IsEmail()
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'ayman@gmail.com', description: 'Member Email' }) // * Swagger Document
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
  @ApiProperty({ example: '+212607080904', description: 'Member Phone Number' }) // * Swagger Document
  phoneNumber!: string;

  // * Address
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Hay almal Bengurir', description: 'Member Address' }) // * Swagger Document
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
  @ApiProperty({ example: '+212607080905', description: 'Member Phone Number' }) // * Swagger Document
  emergencyContact!: string;

  // * Membership PlanId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd155',
    description: 'Membership Plan id',
  }) // * Swagger Document
  membershipPlanId!: string;

  // * Membership Plan DurationId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd156',
    description: 'Membership Plan Duration id',
  }) // * Swagger Document
  membershipPlanDurationId!: string;
}
