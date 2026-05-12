import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const swaggerConfig = new DocumentBuilder()
  .setTitle('Cotizador API')
  .setDescription(
    'API BFF para cotizaciones de proyectos (login JWT y próximos módulos).',
  )
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Token obtenido en POST /api/auth/login',
    },
    'access-token',
  )
  .addTag('App', 'Comprobaciones básicas del servicio')
  .addTag('Autenticación', 'Login, perfil y logout')
  .addTag('Cotizaciones', 'CRUD de cotizaciones del usuario autenticado')
  .build();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const openApiDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, openApiDoc, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
