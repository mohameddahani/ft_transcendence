import {
  resetPasswordTemplate,
  verificationTemplate,
} from '@/utils/email-templates';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly domain: string;
  constructor(private readonly config: ConfigService) {
    // * Config Resend service
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));

    // * Get domain
    this.domain = this.config.getOrThrow<string>('FRONTEND_URL');
  }

  // * Send verification email
  async sendVerificationEmail(email: string, token: string) {
    // * Create link
    const link = `${this.domain}/api/users/auth/activate?token=${token}`;

    // * Send Email
    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Activate your account',
      html: verificationTemplate(link),
    });
  }

  // * Send reset password email
  async sendResetPasswordEmail(email: string, token: string) {
    const link = `${this.domain}/api/users/auth/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset your password',
      html: resetPasswordTemplate(link),
    });
  }
}
