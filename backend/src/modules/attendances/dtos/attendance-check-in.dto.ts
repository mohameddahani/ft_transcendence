import { IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { AttendanceMethod } from '@/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceCheckInDto {
  // * Member Id
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd156',
    description: 'Member id',
  }) // * Swagger Document
  memberId!: string;

  // * Attendance Method
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(AttendanceMethod)
  @ApiProperty({ enum: AttendanceMethod, example: AttendanceMethod.QR_CODE }) // * Swagger Document
  attendanceMethod!: AttendanceMethod;
}
