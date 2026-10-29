import { EmailSender } from '@/core/interfaces/email-sender.interface';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendEmail implements EmailSender {
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
  }

  async send(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const { error } = await this.resend.emails.send(options);

    if (error) {
      throw new InternalServerErrorException('Failed to send email.');
    }
  }
}
