// import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
// import { Throttle } from '@nestjs/throttler';
// import { MemberAccountService } from './member-account.service';
// import { LoginMemberDto } from './dto/login-member.dto';

// @Controller('/api/members')
// export class MemberAccountController {
//   constructor(private readonly memberAccountService: MemberAccountService) {}

//   // * Login
//   @Post('login')
//   @HttpCode(HttpStatus.OK) // * set default status code
//   @Throttle({ default: { limit: 5, ttl: 60_000 } })
//   login(@Body() body: LoginMemberDto) {
//     return this.memberAccountService.login(body);
//   }
// }
