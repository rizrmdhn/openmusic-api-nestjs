import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateAlbumDtoSchema = z.object({
  name: z.string().max(255),
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
});

export class UpdateAlbumDto extends createZodDto(UpdateAlbumDtoSchema) {}
