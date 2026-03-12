import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserDtoSchema = z.object({
  fullname: z.string().max(255),
  username: z.string().max(255),
  password: z.string().min(1).max(255),
});

export class CreateUserDto extends createZodDto(CreateUserDtoSchema) {}
