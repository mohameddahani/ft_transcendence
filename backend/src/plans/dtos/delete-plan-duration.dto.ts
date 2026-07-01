import { IsUUID } from 'class-validator';

export class DeletePlanDurationDto {
  // * PlanId
  @IsUUID()
  planId!: string;
}
