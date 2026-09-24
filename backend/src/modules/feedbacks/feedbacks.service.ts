import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AccessesService } from '@/core/services/access.service';
import { CreateFeedbackLikeDto } from './dto/create-feedback-like.dto';
import { RemoveFeedbackLikeDto } from './dto/remove-feedback-like.dto';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';

@Injectable()
export class FeedbacksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Create Feedback
  async createFeedbackByMember(memberId: string, data: CreateFeedbackDto) {
    // * Check If The Member Has Permissions
    const adminId = await this.checkIfTheMemberHasPermissions(memberId);

    // * Get Satff of this member
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        adminId: adminId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member Not Found.');
    }

    // * Create feedback
    await this.prisma.feedback.create({
      data: {
        admin: { connect: { id: adminId } },
        member: { connect: { id: memberId } },
        staff: member.staffId ? { connect: { id: member.staffId } } : undefined,
        content: data.content,
        rating: data.rating,
      },
    });
  }

  // * Get all Feedbacks
  async findAllFeedbacksByMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    // * Check If The Member Has Permissions
    const adminId = await this.checkIfTheMemberHasPermissions(memberId);

    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        adminId,
      },

      skip: (page - 1) * limit,
      take: limit,

      select: {
        id: true,
        admin: true,
        member: true,
        staff: true,
        content: true,
        rating: true,
        feedbackStatus: true,
        resolvedAt: true,
        resolvedBy: true,
        resolutionNote: true,

        // * Count likes
        _count: {
          select: {
            likes: true,
          },
        },

        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (feedbacks.length === 0) {
      throw new NotFoundException('There is No Feedbacks To Show');
    }

    return feedbacks;
  }

  // * Get One Feedback (Member)
  async findOneFeedbackByMember(memberId: string, feedbackId: string) {
    // * Check If The Member Has Permissions
    const adminId = await this.checkIfTheMemberHasPermissions(memberId);

    const feedback = await this.prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        adminId,
      },

      select: {
        id: true,
        admin: true,
        member: true,
        staff: true,
        content: true,
        rating: true,
        feedbackStatus: true,
        resolvedAt: true,
        resolvedBy: true,
        resolutionNote: true,

        // * Count likes
        _count: {
          select: {
            likes: true,
          },
        },

        createdAt: true,
        updatedAt: true,
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback Not Found');
    }

    return feedback;
  }

  // * Like a Feedback (Member)
  async createLikeByMember(memberId: string, data: CreateFeedbackLikeDto) {
    // * Check if feedback is exist
    await this.findOneFeedbackByMember(memberId, data.feedbackId);

    // * Check if member already like this feedback
    const feedbackAlreadyLiked = await this.prisma.feedbackLike.findUnique({
      where: {
        feedbackId_memberId: {
          feedbackId: data.feedbackId,
          memberId: memberId,
        },
      },
    });

    if (feedbackAlreadyLiked) {
      throw new ConflictException('You already like this feedback');
    }

    // * Like this feedback
    await this.prisma.feedbackLike.create({
      data: {
        feedback: { connect: { id: data.feedbackId } },
        member: { connect: { id: memberId } },
      },
    });
  }

  // * Remove Like a Feedback (Member)
  async removeLikeByMember(memberId: string, data: RemoveFeedbackLikeDto) {
    // * Check if feedback is exist
    await this.findOneFeedbackByMember(memberId, data.feedbackId);

    // * Check if member already like this feedback
    const feedbackAlreadyLiked = await this.prisma.feedbackLike.findUnique({
      where: {
        feedbackId_memberId: {
          feedbackId: data.feedbackId,
          memberId,
        },
      },
    });

    if (!feedbackAlreadyLiked) {
      throw new ConflictException('You have not liked this feedback.');
    }

    // * Remove Like From this feedback
    await this.prisma.feedbackLike.delete({
      where: {
        feedbackId_memberId: {
          feedbackId: data.feedbackId,
          memberId,
        },
      },
    });
  }

  // * Delete Feedback (Member)
  async removeFeedbackByMember(memberId: string, feedbackId: string) {
    // * Check if this feedback already exist
    const feedback = await this.findOneFeedbackByMember(memberId, feedbackId);

    // * check if this feedback is belong to this member
    if (feedback.member.id !== memberId) {
      throw new ForbiddenException('You Cannot Delte this feedback');
    }

    // * Delete the Feedback
    await this.prisma.feedback.delete({
      where: { id: feedbackId },
    });
  }

  // * Get all Feedbacks (Admin / Staff)
  async findAllFeedbacks(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        adminId,
      },

      skip: (page - 1) * limit,
      take: limit,

      select: {
        id: true,
        admin: true,
        member: true,
        staff: true,
        content: true,
        rating: true,
        feedbackStatus: true,
        resolvedAt: true,
        resolvedBy: true,
        resolutionNote: true,

        // * Count likes
        _count: {
          select: {
            likes: true,
          },
        },

        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (feedbacks.length === 0) {
      throw new NotFoundException('There is No Feedbacks To Show');
    }

    return feedbacks;
  }

  // * Get One Feedback (Admin / Staff)
  async findOneFeedback(
    accessTokenPayload: AccessTokenPayload,
    feedbackId: string,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const feedback = await this.prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        adminId,
      },

      select: {
        id: true,
        admin: true,
        member: true,
        staff: true,
        content: true,
        rating: true,
        feedbackStatus: true,
        resolvedAt: true,
        resolvedBy: true,
        resolutionNote: true,

        // * Count likes
        _count: {
          select: {
            likes: true,
          },
        },

        createdAt: true,
        updatedAt: true,
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback Not Found');
    }

    return feedback;
  }

  // ! Private
  private async checkIfTheMemberHasPermissions(memberId: string) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check if Member Has Membership
    await this.accessesService.validateActiveMembership(memberId, adminId);

    return adminId;
  }
}
