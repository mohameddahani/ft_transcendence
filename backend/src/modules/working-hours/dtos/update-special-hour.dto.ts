import { PartialType } from '@nestjs/swagger';
import { AddSpecialHourDto } from './add-special-hour.dto';

export class UpdateSpecialHourDto extends PartialType(AddSpecialHourDto) {}
