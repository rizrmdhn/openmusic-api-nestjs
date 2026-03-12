import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CollaborationsService } from './collaborations.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import type { AccessTokenPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('collaborations')
@UseGuards(JwtGuard)
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCollaborationDto,
  ) {
    const collaboration = await this.collaborationsService.create(
      user.userId,
      dto,
    );
    return {
      data: {
        collaborationId: collaboration.id,
        ...collaboration,
      },
    };
  }

  @Delete()
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCollaborationDto,
  ) {
    const deletedCollaboration = await this.collaborationsService.delete(
      user.userId,
      dto,
    );
    return {
      data: {
        collaborationId: deletedCollaboration.id,
        ...deletedCollaboration,
      },
    };
  }
}
