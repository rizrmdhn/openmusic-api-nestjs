export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<unknown>;
}

export class SendEmailFailedError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`Send email failed: ${message}`);
    this.name = 'SendEmailFailedError';
  }
}
