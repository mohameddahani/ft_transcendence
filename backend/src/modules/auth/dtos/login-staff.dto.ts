import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginStaffDto {
  // * User Name
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({
    example: 'mohamed-dahani-x14s',
    description: 'Member User Name',
  }) // * Swagger Document
  userName!: string;

  // * Password
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'Member Password' }) // * Swagger Document
  password!: string;
}
