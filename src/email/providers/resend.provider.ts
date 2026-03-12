import { Resend } from 'resend';
import { env } from '../../config/env';
import type { EmailProvider, SendEmailOptions } from '../email.types';
import { SendEmailFailedError } from '../email.types';

const resend = new Resend(env.RESEND_API_KEY);

export const resendProvider: EmailProvider = {
  async send(options: SendEmailOptions) {
    const { data, error } = await resend.emails.send({
      from: options.from ?? env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      throw new SendEmailFailedError('resend send failed', error);
    }

    return data;
  },
};
