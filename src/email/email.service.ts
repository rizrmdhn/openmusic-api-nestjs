import { Injectable, Logger } from '@nestjs/common';
import { env } from '../config/env';
import { nodemailerProvider } from './providers/nodemailer.provider';
import { resendProvider } from './providers/resend.provider';
import type { EmailProvider, SendEmailOptions } from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: EmailProvider;

  constructor() {
    this.provider =
      env.EMAIL_DRIVER === 'resend' ? resendProvider : nodemailerProvider;

    this.logger.log(`Using email driver: ${env.EMAIL_DRIVER}`);
  }

  async send(options: SendEmailOptions) {
    return this.provider.send(options);
  }

  async sendPlaylistExport(data: {
    to: string;
    playlist: {
      id: string;
      name: string;
      songs: { id: string; title: string; performer: string }[];
    };
  }) {
    const songRows = data.playlist.songs
      .map(
        (s, i) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${s.title}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${s.performer}</td>
          </tr>`,
      )
      .join('');

    const html = `
      <h2>Playlist Export: ${data.playlist.name}</h2>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd">#</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd">Title</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd">Performer</th>
          </tr>
        </thead>
        <tbody>${songRows}</tbody>
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px">
        This export was requested from OpenMusic API.
      </p>
    `;

    const text = [
      `Playlist Export: ${data.playlist.name}`,
      '',
      ...data.playlist.songs.map(
        (s, i) => `${i + 1}. ${s.title} — ${s.performer}`,
      ),
    ].join('\n');

    return this.send({
      to: data.to,
      subject: `[OpenMusic] Export Playlist: ${data.playlist.name}`,
      html,
      text,
    });
  }
}
