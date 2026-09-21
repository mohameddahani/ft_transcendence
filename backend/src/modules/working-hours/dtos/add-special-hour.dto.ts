import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsMilitaryTime,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddSpecialHourDto {
  @ApiProperty({
    description: 'Start date of the special closure.',
    example: '2026-09-25',
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date of the special closure.',
    example: '2026-09-25',
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description:
      'Start time of the closure in HH:mm format. Null means full-day closure.',
    example: '14:00',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsMilitaryTime()
  startTime!: string;

  @ApiPropertyOptional({
    description:
      'End time of the closure in HH:mm format. Null means full-day closure.',
    example: '18:00',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsMilitaryTime()
  endTime!: string;
}
