import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 4000;
  const apiPrefix = config.get<string>('apiPrefix') ?? 'api/v1';
  const env = config.get<string>('env') ?? 'development';
  const storageDir = config.get<string>('storage.localDir') ?? './storage';

  // ── Security & performance middleware ──
  app.use(
    helmet({
      // Screenshots served from /storage are consumed by the mobile client, not a browser.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());

  // ── CORS (mobile clients + local tooling) ──
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix + validation ──
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Serve locally-stored objects (screenshots, artwork) when STORAGE_DRIVER=local ──
  app.useStaticAssets(join(process.cwd(), storageDir), { prefix: '/storage/' });

  // ── OpenAPI docs ──
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Warzone Companion API')
    .setDescription(
      'Backend API for Warzone Companion. The mobile client talks only to this API — never to third-party game services directly.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`Warzone Companion API listening on http://0.0.0.0:${port}/${apiPrefix}`);
  logger.log(`OpenAPI docs available at http://0.0.0.0:${port}/docs`);
  logger.log(`Environment: ${env}`);
}

bootstrap();
