import { AiApiType } from '@/core/types/ai-api.type';
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

  async getSentiment(content: string): Promise<AiApiType | null> {
    try {
      const response = await axios.post<AiApiType>(
        this.aiApiUrl,
        { content },
        {
          timeout: 5_000, // Stop waiting after 5 seconds.
        },
      );

      return response.data;
    } catch {
      this.logger.warn(
        'AI sentiment request failed. Feedback will be saved without sentiment.',
      );

      return null;
    }
  }
}
