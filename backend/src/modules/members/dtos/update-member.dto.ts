import { PartialType } from '@nestjs/mapped-types';
import { AddMemberDto } from './add-member.dto';

export class UpdateMemberDto extends PartialType(AddMemberDto) {}
