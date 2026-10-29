// nodemailer-email.sender.ts

import { EmailSender } from '@/core/interfaces/email-sender.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class NodemailerEmail implements EmailSender {
  // * is the object that actually knows how to communicate with the email server (email server: Gmail).
  // * The transporter is basically a configured email-sending client.
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',

      auth: {
        user: this.config.getOrThrow<string>('NODE_MAIL_USER'),
        pass: this.config.getOrThrow<string>('NODE_MAIL_PASSWORD'),
      },
    });
  }

  async send(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    await this.transporter.sendMail(options);
  }
}
