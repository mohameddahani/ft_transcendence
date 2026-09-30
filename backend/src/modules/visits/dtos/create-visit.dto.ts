import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({
    description: 'The date and time of the gym visit',
    example: '2026-09-17T14:30:00.000Z',
    type: Date,
    format: 'date-time',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  visitDateAndTime!: Date;
}
