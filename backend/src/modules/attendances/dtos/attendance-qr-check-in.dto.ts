import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceQrCheckInDto {
  @ApiProperty({
    description: 'Hashed QR token used to check in the member',
    example: '8f14e45fceea167a5a36dedd4bea2543',
  })
  @IsString()
  @IsNotEmpty()
  rowToken!: string;
}
