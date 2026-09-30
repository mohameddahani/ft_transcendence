import { PartialType } from '@nestjs/swagger';
import { AddMemberDto } from './add-member.dto';

export class UpdateMemberDto extends PartialType(AddMemberDto) {}
