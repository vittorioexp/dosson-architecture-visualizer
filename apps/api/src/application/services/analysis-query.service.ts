import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toMermaid, toPlantUml, toJson } from '@dosson-architecture-visualizer/graph';
import type { AnalysisDetailResponse, GraphResponse, GraphType } from '@dosson-architecture-visualizer/shared';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AnalysisQueryService {
  constructor(private prisma: PrismaService) {}

  async getAnalysis(userId: string, analysisId: string): Promise<AnalysisDetailResponse> {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: true },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.project.userId !== userId) throw new ForbiddenException();

    const result = analysis.result as Record<string, unknown> | null;
    return {
      id: analysis.id,
      status: analysis.status as AnalysisDetailResponse['status'],
      progress: analysis.progress,
      currentStep: analysis.currentStep || undefined,
      error: analysis.error || undefined,
      startedAt: analysis.startedAt.toISOString(),
      completedAt: analysis.completedAt?.toISOString(),
      scores: result?.scores as Record<string, number> | undefined,
      technologies: [
        ...((result?.languages as Array<{ name: string }>)?.map((l) => l.name) || []),
        ...((result?.frameworks as Array<{ name: string }>)?.map((f) => f.name) || []),
      ],
    };
  }

  async getAnalysisResult(userId: string, analysisId: string) {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: true },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.project.userId !== userId) throw new ForbiddenException();
    return {
      result: analysis.result,
      aiResult: analysis.aiResult,
    };
  }

  async getGraphs(userId: string, analysisId: string): Promise<GraphResponse[]> {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: true, graphs: true },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.project.userId !== userId) throw new ForbiddenException();

    return analysis.graphs.map((g) => ({
      id: g.id,
      type: g.type as GraphType,
      nodes: g.nodes as unknown as GraphResponse['nodes'],
      edges: g.edges as unknown as GraphResponse['edges'],
      metadata: g.metadata as Record<string, unknown>,
    }));
  }

  async getGraph(userId: string, analysisId: string, type: GraphType): Promise<GraphResponse> {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: true },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.project.userId !== userId) throw new ForbiddenException();

    const graph = await this.prisma.graph.findFirst({
      where: { analysisId, type },
    });
    if (!graph) throw new NotFoundException(`Graph type '${type}' not found`);

    return {
      id: graph.id,
      type: graph.type as GraphType,
      nodes: graph.nodes as unknown as GraphResponse['nodes'],
      edges: graph.edges as unknown as GraphResponse['edges'],
      metadata: graph.metadata as Record<string, unknown>,
    };
  }

  async exportGraph(userId: string, analysisId: string, type: GraphType, format: string): Promise<string> {
    const graph = await this.getGraph(userId, analysisId, type);
    const data = { nodes: graph.nodes, edges: graph.edges, metadata: graph.metadata };

    switch (format) {
      case 'mermaid': return toMermaid(data);
      case 'plantuml': return toPlantUml(data);
      case 'json': return toJson(data);
      default: throw new NotFoundException(`Export format '${format}' not supported`);
    }
  }

  async getLatestAnalysis(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException();

    const analysis = await this.prisma.analysis.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (!analysis) throw new NotFoundException('No analysis found');
    return analysis;
  }
}
