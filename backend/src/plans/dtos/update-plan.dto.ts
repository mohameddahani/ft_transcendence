import { PartialType } from '@nestjs/mapped-types';
import { AddPlanDto } from './add-plan.dto';

export class UpdatePlanDto extends PartialType(AddPlanDto) {}
