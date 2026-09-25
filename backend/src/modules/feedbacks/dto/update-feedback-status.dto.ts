import { FeedbackStatus } from '@/generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateFeedbackStatusDto {
  @ApiProperty({
    description: 'New status of the feedback',
    enum: FeedbackStatus,
    example: FeedbackStatus.RESOLVED,
  })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(FeedbackStatus)
  feedbackStatus!: FeedbackStatus;

  @ApiPropertyOptional({
    description: 'Resolution note for the feedback',
    example: 'The issue was reviewed and resolved by the staff.',
    minLength: 3,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  resolutionNote?: string;
}
