import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PlaylistsService } from '../playlists/playlists.service';
import { ExportPlaylistDto } from './dto/export.dto';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { QueueName } from '../../rabbitmq/rabbitmq.types';
import { EmailService } from '../../email/email.service';

@Injectable()
export class ExportService implements OnModuleInit {
  constructor(
    private readonly playlistService: PlaylistsService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.rabbitMQService.consume(QueueName.EXPORT_PLAYLIST, async (data) => {
      await this.emailService.sendPlaylistExport({
        to: data.targetEmail,
        playlist: data.playlist,
      });
    });
  }

  async exportPlaylist(
    userId: string,
    playlistId: string,
    dto: ExportPlaylistDto,
  ) {
    const playlist = await this.playlistService.findById(playlistId);

    if (!playlist)
      throw new NotFoundException(`Playlist with id ${playlistId} not found`);

    if (playlist.owner !== userId)
      throw new ForbiddenException(
        `Forbidden don't have access to export this playlist`,
      );

    this.rabbitMQService.publish(QueueName.EXPORT_PLAYLIST, {
      targetEmail: dto.targetEmail,
      playlist: playlist,
    });

    return true;
  }
}
