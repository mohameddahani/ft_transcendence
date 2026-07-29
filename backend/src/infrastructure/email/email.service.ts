import { Inject, Injectable } from '@nestjs/common';
import { Resend } from 'resend';

import {
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
  setPasswordEmailTemplate,
} from './templates';

import { RESEND } from './email.provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly frontendUrl: string;

  constructor(
    @Inject(RESEND)
    private readonly resend: Resend,

    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
  }

  async sendVerificationEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/auth/email-verification?token=${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',

      to: email,

      subject: 'Activate your account',

      html: verificationEmailTemplate(link),
    });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',

      to: email,

      subject: 'Reset your password',

      html: resetPasswordEmailTemplate(link),
    });
  }

  async sendSetPasswordEmail(username: string, email: string, token: string) {
    const link = `${this.frontendUrl}/auth/members/set-password?token=${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',

      to: email,

      subject: 'Set your password',

      html: setPasswordEmailTemplate(link, username),
    });
  }
}
