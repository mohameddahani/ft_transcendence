import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceManualCheckInDto {
  // * Member Id
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd156',
    description: 'Member id',
  }) // * Swagger Document
  memberId!: string;

  // * Visit Id
  @IsUUID()
  @ApiProperty({
    example: 'a32790dc-4cc2-4f3c-ae33-ec7aee5e73fb',
    description: 'Visit id',
  }) // * Swagger Document
  visitId!: string;
}
