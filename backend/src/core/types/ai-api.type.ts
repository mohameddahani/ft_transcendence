import { SentimentType } from '@/generated/prisma/enums';

export type AiApiType = {
  sentiment: SentimentType;
  sentimentScore: number;
};
