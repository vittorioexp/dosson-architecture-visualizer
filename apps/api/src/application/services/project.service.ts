import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { CreateProjectRequest, PaginatedResponse, ProjectResponse } from '@dosson-architecture-visualizer/shared';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('analysis') private analysisQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateProjectRequest): Promise<ProjectResponse> {
    let githubOwner: string | undefined;
    let githubRepo: string | undefined;

    if (dto.sourceType === 'github' && dto.githubUrl) {
      const match = dto.githubUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
      if (!match) throw new Error('Invalid GitHub URL');
      githubOwner = match[1];
      githubRepo = match[2].replace(/\.git$/, '');
    }

    const project = await this.prisma.project.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        sourceType: dto.sourceType,
        sourceUrl: dto.githubUrl,
        githubOwner,
        githubRepo,
        githubBranch: dto.githubBranch || 'main',
      },
    });

    const analysis = await this.prisma.analysis.create({
      data: { projectId: project.id, status: 'queued', progress: 0 },
    });

    await this.analysisQueue.add('analyze', {
      projectId: project.id,
      analysisId: analysis.id,
      sourceType: dto.sourceType,
      githubOwner,
      githubRepo,
      githubBranch: dto.githubBranch || 'main',
    });

    return this.toResponse(project);
  }

  async createFromUpload(
    userId: string,
    name: string,
    sourceType: 'zip' | 'local',
    storageKey: string,
    description?: string,
  ): Promise<ProjectResponse> {
    const project = await this.prisma.project.create({
      data: {
        userId,
        name,
        description,
        sourceType,
        storageKey,
      },
    });

    const analysis = await this.prisma.analysis.create({
      data: { projectId: project.id, status: 'queued', progress: 0 },
    });

    await this.analysisQueue.add('analyze', {
      projectId: project.id,
      analysisId: analysis.id,
      sourceType,
      storageKey,
    });

    return this.toResponse(project);
  }

  async findAll(userId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<ProjectResponse>> {
    const skip = (page - 1) * pageSize;
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      this.prisma.project.count({ where: { userId } }),
    ]);

    return {
      data: projects.map((p) => this.toResponse(p, p.analyses[0])),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(userId: string, id: string): Promise<ProjectResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException();
    return this.toResponse(project, project.analyses[0]);
  }

  async delete(userId: string, id: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException();
    await this.prisma.project.delete({ where: { id } });
  }

  async reanalyze(userId: string, projectId: string): Promise<ProjectResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException();

    const analysis = await this.prisma.analysis.create({
      data: { projectId, status: 'queued', progress: 0 },
    });

    await this.analysisQueue.add('analyze', {
      projectId,
      analysisId: analysis.id,
      sourceType: project.sourceType,
      githubOwner: project.githubOwner,
      githubRepo: project.githubRepo,
      githubBranch: project.githubBranch,
      storageKey: project.storageKey,
    });

    return this.findOne(userId, projectId);
  }

  private toResponse(
    project: {
      id: string; name: string; description: string | null; sourceType: string;
      sourceUrl: string | null; githubOwner: string | null; githubRepo: string | null;
      githubBranch: string | null; createdAt: Date; updatedAt: Date; lastAnalyzedAt: Date | null;
    },
    latestAnalysis?: { id: string; status: string; progress: number; currentStep: string | null; startedAt: Date; completedAt: Date | null },
  ): ProjectResponse {
    return {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      sourceType: project.sourceType as ProjectResponse['sourceType'],
      sourceUrl: project.sourceUrl || undefined,
      githubOwner: project.githubOwner || undefined,
      githubRepo: project.githubRepo || undefined,
      githubBranch: project.githubBranch || undefined,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      lastAnalyzedAt: project.lastAnalyzedAt?.toISOString(),
      latestAnalysis: latestAnalysis ? {
        id: latestAnalysis.id,
        status: latestAnalysis.status as ProjectResponse['latestAnalysis'] extends infer T ? T extends { status: infer S } ? S : never : never,
        progress: latestAnalysis.progress,
        currentStep: latestAnalysis.currentStep || undefined,
        startedAt: latestAnalysis.startedAt.toISOString(),
        completedAt: latestAnalysis.completedAt?.toISOString(),
      } : undefined,
    };
  }
}
