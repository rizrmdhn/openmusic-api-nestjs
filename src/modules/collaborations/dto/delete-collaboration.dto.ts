import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DeleteCollaborationDtoSchema = z.object({
  playlistId: z.string().max(255),
  userId: z.string().max(255),
});

export class DeleteCollaborationDto extends createZodDto(
  DeleteCollaborationDtoSchema,
) {}
