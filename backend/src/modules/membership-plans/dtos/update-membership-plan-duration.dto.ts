import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class UpdateMembershipPlanDurationDto {
  // * MembershipId
  @IsUUID()
  membershipPlanId!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  @IsOptional()
  durationDays?: number;

  // * Price
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
}
