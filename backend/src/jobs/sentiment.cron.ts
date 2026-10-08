import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ExternalApiService } from '@/infrastructure/external-api/external-api.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SentimentCron {
  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApiService: ExternalApiService,
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // * Check the feedback that has no sentiment and try to get his sentimet
  async getSentiment() {
    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        OR: [{ sentiment: null }, { sentimentScore: null }],
      },
    });

    if (feedbacks.length === 0) {
      return;
    }

    for (const feedback of feedbacks) {
      const response = await this.externalApiService.getSentiment(
        feedback.content,
      );

      if (response) {
        await this.prisma.feedback.update({
          where: { id: feedback.id },
          data: {
            sentiment: response.sentiment,
            sentimentScore: response.sentimentScore,
          },
        });
      }
    }
  }
}
