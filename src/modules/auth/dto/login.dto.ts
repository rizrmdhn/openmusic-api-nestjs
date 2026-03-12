import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginDtoSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export class LoginDto extends createZodDto(LoginDtoSchema) {}
