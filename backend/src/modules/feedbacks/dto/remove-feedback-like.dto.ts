import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RemoveFeedbackLikeDto {
  @ApiProperty({
    description: 'ID of the feedback to like',
    example: '8f4c7b4b-29f3-4b3f-9d55-2f1a6df6d4f1',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  feedbackId!: string;
}
