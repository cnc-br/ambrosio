import 'dotenv/config';

import './instrument.js';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionsFilter } from './commons/exceptions/prisma-exceptions/prisma-exceptions.filter.js';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import * as rTracer from 'cls-rtracer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Middleware para rastrear cada request com um requestId único
  app.use(rTracer.expressMiddleware());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Ambrosio')
    .setDescription('The CNC API documentation')
    .setVersion('1.56.0')
    .addTag('cnc')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());


  app.useGlobalFilters(
    app.get(SentryGlobalFilter),
    app.get(PrismaExceptionsFilter),
  );

  await app.startAllMicroservices();
  await app.listen(3005);
}
await bootstrap();
