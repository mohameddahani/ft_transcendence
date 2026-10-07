import { AiApiType } from '@/core/types/ai-api.type';
import { CreateFeedbackDto } from '@/modules/feedbacks/dto/create-feedback.dto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ExternalApiService {
  private readonly aiApiUrl: string;
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(private readonly config: ConfigService) {
    this.aiApiUrl = config.getOrThrow<string>('AI_API_URL');
  }

  async getSentiment(data: CreateFeedbackDto): Promise<AiApiType | null> {
    try {
      const response = await axios.post<AiApiType>(this.aiApiUrl, data, {
        timeout: 5_000,
      });

      return response.data;
    } catch {
      this.logger.warn(
        'AI sentiment request failed. Feedback will be saved without sentiment.',
      );

      return null;
    }
  }
}
