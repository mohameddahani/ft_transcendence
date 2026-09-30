import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { Throttle } from '@nestjs/throttler';
import { CreateFeedbackLikeDto } from './dto/create-feedback-like.dto';
import { RemoveFeedbackLikeDto } from './dto/remove-feedback-like.dto';
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';

@Controller('/api/members/feedbacks')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberFeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  // * Create Feedback
  @Post('create')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createFeedbackByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: CreateFeedbackDto,
  ) {
    return this.feedbacksService.createFeedbackByMember(
      accessTokenPayload.id,
      body,
    );
  }

  // * Get all Feedbacks (Member)
  @Get()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  findAllFeedbacksByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.feedbacksService.findAllFeedbacksByMember(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Get One Feedback (Member)
  @Get(':id')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  findOneFeedbackByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feedbacksService.findOneFeedbackByMember(
      accessTokenPayload.id,
      id,
    );
  }

  // * Like a Feedback (Member)
  @Post('like')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createLikeByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: CreateFeedbackLikeDto,
  ) {
    return this.feedbacksService.createLikeByMember(
      accessTokenPayload.id,
      body,
    );
  }

  // * Remove Like a Feedback (Member)
  @Post('remove-like')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  removeLikeByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: RemoveFeedbackLikeDto,
  ) {
    return this.feedbacksService.removeLikeByMember(
      accessTokenPayload.id,
      body,
    );
  }

  // * Delete Feedback (Member)
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  removeFeedbackByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feedbacksService.removeFeedbackByMember(
      accessTokenPayload.id,
      id,
    );
  }
}
