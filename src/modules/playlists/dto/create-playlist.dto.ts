import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePlaylistDtoSchema = z.object({
  name: z.string().max(255),
});

export class CreatePlaylistDto extends createZodDto(CreatePlaylistDtoSchema) {}
