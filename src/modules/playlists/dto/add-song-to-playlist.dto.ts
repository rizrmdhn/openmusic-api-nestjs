import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddSongToPlaylistDtoSchema = z.object({
  songId: z.string().max(255),
});

export class AddSongToPlaylistDto extends createZodDto(
  AddSongToPlaylistDtoSchema,
) {}
