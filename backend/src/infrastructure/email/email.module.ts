import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { NodemailerEmail } from './nodemailer-email';
import { ResendEmail } from './resend-email';
import { EMAIL_SENDER } from '@/core/constants/email.constants';
@Module({
  providers: [
    NodemailerEmail,
    ResendEmail,

    {
      provide: EMAIL_SENDER,

      inject: [ConfigService, NodemailerEmail, ResendEmail],

      useFactory: (
        config: ConfigService,
        nodemailerSender: NodemailerEmail,
        resendSender: ResendEmail,
      ) => {
        const nodeEnv = config.getOrThrow<string>('NODE_ENV');

        if (nodeEnv === 'production') {
          return resendSender;
        }

        return nodemailerSender;
      },
    },

    EmailService,
  ],

  exports: [EmailService],
})
export class EmailModule {}
