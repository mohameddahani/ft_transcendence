// import {
//   Body,
//   Controller,
//   HttpCode,
//   HttpStatus,
//   Post,
//   UseGuards,
// } from '@nestjs/common';
// import { AuthRolesGuard } from '@/core/guards/roles.guard';
// import { Role } from '@/generated/prisma/enums';
// import { Roles } from '@/core/decorators/user-role.decorator';
// import { AttendancesService } from './attendances.service';
// import { Throttle } from '@nestjs/throttler';
// import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
// import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
// import { AttendanceCheckInDto } from './dtos/attendance-check-in.dto';
// import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';

// @Controller('/api/members/attendances')
// // * Make Authorazation Golbal on this route
// @UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
// @Roles([Role.MEMBER])
// export class MemberAttendancesController {
//   constructor(private readonly attendancesService: AttendancesService) {}
// }
