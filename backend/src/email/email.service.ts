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
  constructor(private readonly config: ConfigService) {
    // * Config Resend service
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  // * Send verification email
  async sendVerificationEmail(email: string, token: string) {
    // * Create link
    const link = `http://localhost:3000/auth/verify?token=${token}`;

    // * Send Email
    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your account',
      html: verificationTemplate(link),
    });
  }

  // * Send reset password email
  async sendResetPasswordEmail(email: string, token: string) {
    const link = `http://localhost:3000/auth/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset your password',
      html: resetPasswordTemplate(link),
    });
  }
}
