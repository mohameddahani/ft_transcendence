import { PartialType } from '@nestjs/mapped-types';
import { AddMemeberDto } from './add-member.dto';

export class UpdateMemberDto extends PartialType(AddMemeberDto) {}
