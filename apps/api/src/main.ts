import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { logger } from './infrastructure/logging/logger';

async function bootstrap() {
  if (process.env.OTEL_ENABLED === 'true') {
    try {
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
      const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');

      const sdk = new NodeSDK({
        serviceName: process.env.OTEL_SERVICE_NAME || 'dosson-architecture-visualizer-api',
        traceExporter: new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
        }),
        instrumentations: [getNodeAutoInstrumentations()],
      });
      sdk.start();
      logger.info('OpenTelemetry initialized');
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize OpenTelemetry');
    }
  }

  const app = await NestFactory.create(AppModule, { logger: false });

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Dosson Architecture Visualizer API')
    .setDescription('Dosson enterprise SaaS API for automated software architecture visualization')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT') || 4000;

  await app.listen(port);
  logger.info({ port }, 'Dosson Architecture Visualizer API started');
}

bootstrap();
