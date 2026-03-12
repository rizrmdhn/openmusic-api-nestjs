import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterDtoSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}
