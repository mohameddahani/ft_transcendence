import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  Max,
  Min,
  IsMilitaryTime,
} from 'class-validator';

export class AddWorkingHourDto {
  @ApiProperty({
    description: 'Day of the week. 1 = Monday, 7 = Sunday.',
    example: 1,
    minimum: 1,
    maximum: 7,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({
    description: 'Gym opening time in HH:mm format.',
    example: '09:00',
  })
  @IsNotEmpty()
  @IsMilitaryTime()
  startTime!: string;

  @ApiProperty({
    description: 'Gym closing time in HH:mm format.',
    example: '22:00',
  })
  @IsNotEmpty()
  @IsMilitaryTime()
  endTime!: string;

  @ApiProperty({
    description: 'Whether the gym is closed on this day.',
    example: false,
    default: false,
  })
  @IsBoolean()
  isClosed!: boolean;
}
