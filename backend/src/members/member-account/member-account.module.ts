import { Module } from '@nestjs/common';
import { MemberAccountController } from './member-account.controller';
import { MemberAccountService } from './member-account.service';

@Module({
  controllers: [MemberAccountController],
  providers: [MemberAccountService],
  imports: [],
  exports: [],
})
export class MemberAccount {}
