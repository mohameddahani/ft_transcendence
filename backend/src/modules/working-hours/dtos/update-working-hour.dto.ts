import { PartialType } from '@nestjs/swagger';
import { AddWorkingHourDto } from './add-working-hour.dto';

export class UpdateWorkingHourDto extends PartialType(AddWorkingHourDto) {}
