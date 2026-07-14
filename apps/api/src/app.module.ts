import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { validateEnv } from './config/env.validation';
import { PrismaService } from './infrastructure/database/prisma.service';
import { RedisService } from './infrastructure/cache/redis.service';
import { StorageService } from './infrastructure/storage/storage.service';
import { AiService } from './infrastructure/ai/ai.service';
import { RepositoryIngestService } from './application/services/repository-ingest.service';
import { AnalysisService } from './application/services/analysis.service';
import { ProjectService } from './application/services/project.service';
import { AnalysisQueryService } from './application/services/analysis-query.service';
import { AnalysisProcessor } from './infrastructure/queue/analysis.processor';
import { ProjectsController } from './presentation/controllers/projects.controller';
import { AnalysesController, ProjectAnalysisController } from './presentation/controllers/analyses.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { AuthGuard } from './presentation/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: 'analysis' }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: (config.get('RATE_LIMIT_TTL') || 60) * 1000,
        limit: config.get('RATE_LIMIT_MAX') || 100,
      }]),
    }),
    TerminusModule,
  ],
  controllers: [
    ProjectsController,
    AnalysesController,
    ProjectAnalysisController,
    HealthController,
  ],
  providers: [
    PrismaService,
    RedisService,
    StorageService,
    AiService,
    RepositoryIngestService,
    AnalysisService,
    ProjectService,
    AnalysisQueryService,
    AnalysisProcessor,
    AuthGuard,
  ],
})
export class AppModule {}
