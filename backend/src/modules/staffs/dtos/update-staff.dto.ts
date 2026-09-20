import { PartialType } from '@nestjs/swagger';
import { AddStaffDto } from './add-staff.dto';

export class UpdateStaffDto extends PartialType(AddStaffDto) {}
