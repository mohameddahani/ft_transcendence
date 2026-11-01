import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
  setPasswordEmailTemplate,
  emailChangeTemplate,
} from './templates';
import { EmailTemplateConfig } from '@/core/types/email-template.config.type';
import { EMAIL_SENDER } from '@/core/constants/email.constants';
import type { EmailSender } from '@/core/interfaces/email-sender.interface';

@Injectable()
export class EmailService {
  private readonly frontendUrl: string;
  private readonly mailFrom: string;

  private readonly templateConfig: EmailTemplateConfig;

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,

    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

    this.mailFrom =
      config.getOrThrow<string>('NODE_ENV') === 'production'
        ? this.config.getOrThrow<string>('MAIL_FROM')
        : this.config.getOrThrow<string>('NODE_MAIL_FROM');

    this.templateConfig = {
      appName: this.config.getOrThrow<string>('APP_NAME'),

      supportEmail:
        config.getOrThrow<string>('NODE_ENV') === 'production'
          ? this.config.getOrThrow<string>('SUPPORT_EMAIL')
          : this.config.getOrThrow<string>('NODE_SUPPORT_EMAIL'),

      verificationExpiresIn: this.config.getOrThrow<string>(
        'EMAIL_VERIFICATION_TOKEN_EXPIRES_IN',
      ),

      resetPasswordExpiresIn: this.config.getOrThrow<string>(
        'RESET_PASSWORD_TOKEN_EXPIRES_IN',
      ),

      setPasswordExpiresIn: this.config.getOrThrow<string>(
        'SET_PASSWORD_TOKEN_EXPIRES_IN',
      ),
      emailChangeExpiresIn: this.config.getOrThrow<string>(
        'EMAIL_CHANGE_TOKEN_EXPIRES_IN',
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

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Verify your email | ${this.templateConfig.appName}`,

      html: verificationEmailTemplate(link, this.templateConfig),
    });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/reset-password#token=${token}`;

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Reset your password | ${this.templateConfig.appName}`,

      html: resetPasswordEmailTemplate(link, this.templateConfig),
    });
  }

  async sendEmailChangeVerification(email: string, token: string) {
    const link = `${this.frontendUrl}/email-change#token=${token}`;

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Verify your new email | ${this.templateConfig.appName}`,

      html: emailChangeTemplate(link, this.templateConfig),
    });
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

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Set your password | ${this.templateConfig.appName}`,

      html: setPasswordEmailTemplate(link, username, this.templateConfig),
    });
  }

  async sendResetPasswordMemberEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/members/reset-password#token=${token}`;

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Reset your password | ${this.templateConfig.appName}`,

      html: resetPasswordEmailTemplate(link, this.templateConfig),
    });
  }

  async sendEmailChangeVerificationMember(email: string, token: string) {
    const link = `${this.frontendUrl}/email-change#token=${token}`;

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Verify your new email | ${this.templateConfig.appName}`,

      html: emailChangeTemplate(link, this.templateConfig),
    });
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

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Set your password | ${this.templateConfig.appName}`,

      html: setPasswordEmailTemplate(link, username, this.templateConfig),
    });
  }

  async sendResetPasswordStaffEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/staffs/reset-password#token=${token}`;

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Reset your password | ${this.templateConfig.appName}`,

      html: resetPasswordEmailTemplate(link, this.templateConfig),
    });
  }

  async sendEmailChangeVerificationStaff(email: string, token: string) {
    const link = `${this.frontendUrl}/email-change#token=${token}`;

    await this.emailSender.send({
      from: this.mailFrom,

      to: email,

      subject: `Verify your new email | ${this.templateConfig.appName}`,

      html: emailChangeTemplate(link, this.templateConfig),
    });
  }
}
