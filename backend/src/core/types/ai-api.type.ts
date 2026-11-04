import { SentimentType } from '@/generated/prisma/enums';

export type AiApiType = {
  sentiment: SentimentType;
  score: number;
};
