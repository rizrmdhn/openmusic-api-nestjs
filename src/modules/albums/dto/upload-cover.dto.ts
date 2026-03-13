import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UploadCoverDtoSchema = z.object({
  cover: z
    .file()
    .max(5 * 1024 * 1024)
    .mime('image/jpeg', 'image/png'),
});

export class UploadCoverDto extends createZodDto(UploadCoverDtoSchema) {}
