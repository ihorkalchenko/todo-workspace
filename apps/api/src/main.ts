import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { mkdirSync } from 'fs';

import { AppModule } from './app/app.module';
import { AVATAR_UPLOAD_PATH } from '@todo-workspace/constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads/avatars dir exists
  const uploadsDir = join(process.cwd(), AVATAR_UPLOAD_PATH);
  mkdirSync(uploadsDir, { recursive: true });

  // serve uploads directory at
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // middleware
  app.use(cookieParser())

  // prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // port
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // logger
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
