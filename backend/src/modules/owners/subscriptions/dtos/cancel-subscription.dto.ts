import { IsUUID } from 'class-validator';

export class CancelSubscriptionDto {
  // * UserId
  @IsUUID()
  userId!: string;
}
