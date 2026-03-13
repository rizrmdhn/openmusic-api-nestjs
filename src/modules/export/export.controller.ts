import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ExportService } from './export.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/auth.service';
import { ExportPlaylistDto } from './dto/export.dto';

@Controller('export')
@UseGuards(JwtGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('playlists/:playlistId')
  async exportPlaylist(
    @CurrentUser() user: AccessTokenPayload,
    @Param('playlistId') playlistId: string,
    @Body() dto: ExportPlaylistDto,
  ) {
    const result = await this.exportService.exportPlaylist(
      user.userId,
      playlistId,
      dto,
    );

    if (!result) throw new Error('Failed to export playlist');

    return {
      message:
        'Playlist export is being processed, you will receive an email when it is done',
    };
  }
}
