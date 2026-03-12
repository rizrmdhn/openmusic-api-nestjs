import 'dotenv/config';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().default(3000),
    POSTGRES_URL: z.url(),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    RABBITMQ_URL: z.string().default('amqp://localhost'),
    EMAIL_DRIVER: z.enum(['nodemailer', 'resend']).default('nodemailer'),
    EMAIL_FROM: z.string().default('noreply@openmusic.app'),
    // nodemailer
    EMAIL_PROVIDER: z.enum(['gmail', 'smtp']).optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASSWORD: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    // resend
    RESEND_API_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
});
