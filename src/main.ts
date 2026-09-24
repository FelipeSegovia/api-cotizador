import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  OPENAPI_JSON_PATH,
  OPENAPI_UI_PATH,
  OPENAPI_YAML_PATH,
  buildSwaggerConfig,
} from './openapi/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://tu-sistema.cl',
      'https://www.tu-sistema.cl',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const openApiDoc = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup(OPENAPI_UI_PATH, app, openApiDoc, {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    yamlDocumentUrl: OPENAPI_YAML_PATH,
    customSiteTitle: 'Cotizador API',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
