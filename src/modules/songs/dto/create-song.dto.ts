import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateSongDtoSchema = z.object({
  title: z.string().max(255),
  year: z
    .number()
    .int()
    .refine(
      (year) => {
        const currentYear = new Date().getFullYear();
        return year >= 1900 && year <= currentYear;
      },
      {
        message: `Year must be a valid four-digit number between 1900 and the current year`,
      },
    ),
  genre: z.string().max(100),
  performer: z.string().max(255),
  duration: z.number().int().positive().optional(),
  albumId: z.string().max(255).optional(),
});

export class CreateSongDto extends createZodDto(CreateSongDtoSchema) {}
