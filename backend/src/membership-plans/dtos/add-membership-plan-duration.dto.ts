import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class AddMemebershipPlanDurationDto {
  // * MembershipId
  @IsUUID()
  membershipPlanId!: string;

  // * Duration
  @IsNumber()
  @IsPositive()
  durationDays!: number;

  // * Price
  @IsNumber()
  @IsPositive()
  price!: number;
}
