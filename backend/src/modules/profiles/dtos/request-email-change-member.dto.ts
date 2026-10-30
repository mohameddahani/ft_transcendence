import { AddMemberDto } from '@/modules/members/dtos/add-member.dto';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class RequestEmailChangeMemberDto extends PickType(AddMemberDto, [
  'email',
] as const) {
  // * Current Password
  @IsString()
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ example: 'Passw0rd123@', description: 'Current Password' }) // * Swagger Document
  currentPassword!: string;
}
