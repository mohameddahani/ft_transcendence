import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { Throttle } from '@nestjs/throttler';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';

@Controller('/api/staffs/feedbacks')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffFeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  // * Get all Feedbacks (Staff)
  @Get()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  findAllFeedbacks(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.feedbacksService.findAllFeedbacks(
      accessTokenPayload,
      page,
      limit,
    );
  }

  // * Get One Feedback (Staff)
  @Get(':id')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  findOneFeedback(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feedbacksService.findOneFeedback(accessTokenPayload, id);
  }

  // * Change Feedback Status (Staff)
  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  changeFeedbackStatus(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFeedbackStatusDto,
  ) {
    return this.feedbacksService.changeFeedbackStatus(
      accessTokenPayload,
      id,
      body,
    );
  }
}
