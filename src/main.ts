import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import path from 'path';
import { AppModule } from './app.module';
import { env } from './config/env';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files as static assets (filesystem storage only)
  if (env.STORAGE_TYPE === 'filesystem') {
    const uploadsDir = env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    app.useStaticAssets(uploadsDir, { prefix: '/api/uploads' });
  }

  // app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(env.PORT);
}
void bootstrap();
