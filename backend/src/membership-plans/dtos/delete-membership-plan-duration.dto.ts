import { IsUUID } from 'class-validator';

export class DeleteMembershipPlanDurationDto {
  // * MembershipId
  @IsUUID()
  membershipPlanId!: string;
}
