import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export const RESEND = 'RESEND';

export const ResendProvider = {
  provide: RESEND,
  inject: [ConfigService],

  useFactory: (config: ConfigService) => {
    return new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
  },
};
