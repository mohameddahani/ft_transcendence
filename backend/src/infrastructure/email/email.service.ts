import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { Resend } from 'resend';

import {
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
  setPasswordEmailTemplate,
} from './templates';

import { RESEND } from './email.provider';
import { EmailTemplateConfig } from '@/core/types/email-template.config.type';

@Injectable()
export class EmailService {
  private readonly frontendUrl: string;
  private readonly mailFrom: string;

  private readonly templateConfig: EmailTemplateConfig;

  constructor(
    @Inject(RESEND)
    private readonly resend: Resend,

    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

    this.mailFrom = this.config.getOrThrow<string>('MAIL_FROM');

    this.templateConfig = {
      appName: this.config.getOrThrow<string>('APP_NAME'),

      supportEmail: this.config.getOrThrow<string>('SUPPORT_EMAIL'),

      verificationExpiresIn: this.config.getOrThrow<string>(
        'EMAIL_VERIFICATION_TOKEN_EXPIRES_IN',
      ),

      resetPasswordExpiresIn: this.config.getOrThrow<string>(
        'RESET_PASSWORD_TOKEN_EXPIRES_IN',
      ),

      setPasswordExpiresIn: this.config.getOrThrow<string>(
        'SET_PASSWORD_TOKEN_EXPIRES_IN',
      ),
    };
  }

  /* 
  =========================
  ! Owner / Admin
  =========================
  */

  async sendVerificationEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/email-verification#token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.mailFrom,

      to: email,

      subject: `Verify your email | ${this.templateConfig.appName}`,

      html: verificationEmailTemplate(link, this.templateConfig),
    });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to send verification email.',
      );
    }
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/reset-password#token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.mailFrom,

      to: email,

      subject: `Reset your password | ${this.templateConfig.appName}`,

      html: resetPasswordEmailTemplate(link, this.templateConfig),
    });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to send password reset email.',
      );
    }
  }

  /* 
  =========================
  ! Member
  =========================
  */

  async sendSetPasswordMemberEmail(
    username: string,
    email: string,
    token: string,
  ) {
    const link = `${this.frontendUrl}/members/set-password#token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.mailFrom,

      to: email,

      subject: `Set your password | ${this.templateConfig.appName}`,

      html: setPasswordEmailTemplate(link, username, this.templateConfig),
    });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to send set password email.',
      );
    }
  }

  async sendResetPasswordMemberEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/members/reset-password#token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.mailFrom,

      to: email,

      subject: `Reset your password | ${this.templateConfig.appName}`,

      html: resetPasswordEmailTemplate(link, this.templateConfig),
    });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to send password reset email.',
      );
    }
  }

  /* 
  =========================
  ! Staff
  =========================
  */

  async sendSetPasswordStaffEmail(
    username: string,
    email: string,
    token: string,
  ) {
    const link = `${this.frontendUrl}/staffs/set-password#token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.mailFrom,

      to: email,

      subject: `Set your password | ${this.templateConfig.appName}`,

      html: setPasswordEmailTemplate(link, username, this.templateConfig),
    });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to send set password email.',
      );
    }
  }

  async sendResetPasswordStaffEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/staffs/reset-password#token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.mailFrom,

      to: email,

      subject: `Reset your password | ${this.templateConfig.appName}`,

      html: resetPasswordEmailTemplate(link, this.templateConfig),
    });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to send password reset email.',
      );
    }
  }
}
