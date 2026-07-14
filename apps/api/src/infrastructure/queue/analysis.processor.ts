import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RepositoryIngestService } from '../../application/services/repository-ingest.service';
import { AnalysisService } from '../../application/services/analysis.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { createChildLogger } from '../../infrastructure/logging/logger';

interface AnalysisJobData {
  projectId: string;
  analysisId: string;
  sourceType: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  storageKey?: string;
  localPath?: string;
}

@Processor('analysis')
export class AnalysisProcessor extends WorkerHost {
  private readonly log = createChildLogger('AnalysisProcessor');

  constructor(
    private prisma: PrismaService,
    private ingestService: RepositoryIngestService,
    private analysisService: AnalysisService,
    private storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<AnalysisJobData>): Promise<void> {
    const { projectId, analysisId, sourceType } = job.data;
    let sandboxPath: string | undefined;

    try {
      await this.updateProgress(analysisId, 'ingesting', 10);

      switch (sourceType) {
        case 'github':
          if (!job.data.githubOwner || !job.data.githubRepo) {
            throw new Error('GitHub owner and repo required');
          }
          ({ sandboxPath } = await this.ingestService.ingestFromGitHub(
            job.data.githubOwner,
            job.data.githubRepo,
            job.data.githubBranch,
          ));
          break;
        case 'zip':
          if (!job.data.storageKey) throw new Error('Storage key required for zip');
          const zipData = await this.storageService.download(job.data.storageKey);
          ({ sandboxPath } = await this.ingestService.ingestFromZip(zipData));
          break;
        case 'local':
          if (job.data.localPath) {
            ({ sandboxPath } = await this.ingestService.ingestFromLocal(job.data.localPath));
          } else if (job.data.storageKey) {
            const data = await this.storageService.download(job.data.storageKey);
            ({ sandboxPath } = await this.ingestService.ingestFromZip(data));
          } else {
            throw new Error('Local path or storage key required');
          }
          break;
        default:
          throw new Error(`Unknown source type: ${sourceType}`);
      }

      await this.updateProgress(analysisId, 'analyzing', 40);
      const { output } = await this.analysisService.runAnalysis(sandboxPath!);

      await this.updateProgress(analysisId, 'generating_graphs', 70);

      const graphEntries = Object.entries(output.graphs);
      for (const [type, graphData] of graphEntries) {
        await this.prisma.graph.create({
          data: {
            analysisId,
            type,
            nodes: graphData.nodes as unknown as Prisma.InputJsonValue,
            edges: graphData.edges as unknown as Prisma.InputJsonValue,
            metadata: (graphData.metadata || {}) as Prisma.InputJsonValue,
          },
        });
      }

      await this.updateProgress(analysisId, 'ai_processing', 90);

      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: 'completed',
          progress: 100,
          currentStep: 'completed',
          result: output.result as unknown as Prisma.InputJsonValue,
          aiResult: output.aiResult as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await this.prisma.project.update({
        where: { id: projectId },
        data: { lastAnalyzedAt: new Date() },
      });

      this.log.info({ analysisId, projectId }, 'Analysis completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error({ analysisId, error: message }, 'Analysis failed');

      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: 'failed',
          error: message,
          completedAt: new Date(),
        },
      });
    } finally {
      if (sandboxPath) {
        this.ingestService.cleanup(sandboxPath);
      }
    }
  }

  private async updateProgress(analysisId: string, step: string, progress: number) {
    await this.prisma.analysis.update({
      where: { id: analysisId },
      data: { status: step, currentStep: step, progress },
    });
  }
}
