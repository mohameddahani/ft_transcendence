import { IsNumber, IsPositive, IsString } from 'class-validator';

export class AddMemebershipPlanDurationDto {
  // * MembershipId
  @IsString()
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
