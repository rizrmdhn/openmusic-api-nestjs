import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExportPlaylistDtoSchema = z.object({
  targetEmail: z.email().max(255),
});

export class ExportPlaylistDto extends createZodDto(ExportPlaylistDtoSchema) {}
