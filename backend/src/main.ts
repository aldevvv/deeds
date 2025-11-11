import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit to support massive payloads (500MB)
  // Eliminates "request entity too large" errors permanently
  // Supports 100+ signatures with base64 images easily
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://deeds.id',
      'https://www.deeds.id',
      'https://api.deeds.id'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
  console.log(`🚀 Backend running on http://localhost:${process.env.PORT ?? 4000}`);
}
bootstrap();
