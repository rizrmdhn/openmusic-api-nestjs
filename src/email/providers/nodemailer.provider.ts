import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';
import { env } from '../../config/env';
import type { EmailProvider, SendEmailOptions } from '../email.types';
import { SendEmailFailedError } from '../email.types';

const logger = new Logger('NodemailerProvider');

function createTransporter() {
  switch (env.EMAIL_PROVIDER) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        pool: true,
        auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
      });

    case 'smtp':
      return nodemailer.createTransport({
        pool: true,
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      });

    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER "${env.EMAIL_PROVIDER}". Use "gmail" or "smtp".`,
      );
  }
}

const transporter = createTransporter();

export const nodemailerProvider: EmailProvider & { verify(): Promise<boolean> } =
  {
    async send(options: SendEmailOptions) {
      try {
        const info = await transporter.sendMail({
          from: options.from ?? env.EMAIL_FROM,
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        return info;
      } catch (error) {
        logger.error(`Failed to send email to ${options.to.toString()}`);
        throw new SendEmailFailedError('nodemailer send failed', error);
      }
    },

    async verify() {
      try {
        await transporter.verify();
        logger.log('SMTP connection verified');
        return true;
      } catch {
        logger.warn('SMTP verification failed');
        return false;
      }
    },
  };
