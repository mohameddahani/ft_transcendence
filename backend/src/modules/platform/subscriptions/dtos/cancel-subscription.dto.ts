import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CancelSubscriptionDto {
  // * AdminId
  @IsUUID()
  @ApiProperty({
    example: 'b4453677-b504-44ec-890f-0f42710cd355',
    description: 'Admin id',
  }) // * Swagger Document
  adminId!: string;
}
