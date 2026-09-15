import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceCheckInDto {
  // * Member Id
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd156',
    description: 'Member id',
  }) // * Swagger Document
  memberId!: string;
}
