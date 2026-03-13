import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { EmailService } from '../../email/email.service';
import { PlaylistModule } from '../playlists/playlists.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, PlaylistModule],
  controllers: [ExportController],
  providers: [ExportService, RabbitMQService, EmailService],
  exports: [ExportService],
})
export class ExportModule {}
