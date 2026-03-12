import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCollaborationDtoSchema = z.object({
  playlistId: z.string().max(255),
  userId: z.string().max(255),
});

export class CreateCollaborationDto extends createZodDto(
  CreateCollaborationDtoSchema,
) {}
