import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { GraphType } from '@dosson-architecture-visualizer/shared';
import { AuthGuard } from '../guards/auth.guard';
import { AnalysisQueryService } from '../../application/services/analysis-query.service';

@ApiTags('analyses')
@Controller('api/v1/analyses')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AnalysesController {
  constructor(private analysisQuery: AnalysisQueryService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get analysis status and summary' })
  async getAnalysis(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.analysisQuery.getAnalysis(req.user.id, id);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get full analysis result' })
  async getResult(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.analysisQuery.getAnalysisResult(req.user.id, id);
  }

  @Get(':id/graphs')
  @ApiOperation({ summary: 'Get all graphs for an analysis' })
  async getGraphs(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.analysisQuery.getGraphs(req.user.id, id);
  }

  @Get(':id/graphs/:type')
  @ApiOperation({ summary: 'Get a specific graph' })
  async getGraph(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('type') type: GraphType,
  ) {
    return this.analysisQuery.getGraph(req.user.id, id, type);
  }

  @Get(':id/export/:type/:format')
  @ApiOperation({ summary: 'Export graph in various formats' })
  async exportGraph(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('type') type: GraphType,
    @Param('format') format: string,
  ) {
    const content = await this.analysisQuery.exportGraph(req.user.id, id, type, format);
    return { format, content };
  }
}

@ApiTags('projects')
@Controller('api/v1/projects')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProjectAnalysisController {
  constructor(private analysisQuery: AnalysisQueryService) {}

  @Get(':projectId/analysis')
  @ApiOperation({ summary: 'Get latest analysis for a project' })
  async getLatest(@Req() req: { user: { id: string } }, @Param('projectId') projectId: string) {
    const analysis = await this.analysisQuery.getLatestAnalysis(req.user.id, projectId);
    return this.analysisQuery.getAnalysis(req.user.id, analysis.id);
  }

  @Get(':projectId/dashboard')
  @ApiOperation({ summary: 'Get dashboard data for a project' })
  async getDashboard(@Req() req: { user: { id: string } }, @Param('projectId') projectId: string) {
    const analysis = await this.analysisQuery.getLatestAnalysis(req.user.id, projectId);
    const { result, aiResult } = await this.analysisQuery.getAnalysisResult(req.user.id, analysis.id);
    const r = result as Record<string, unknown>;

    return {
      scores: r?.scores,
      technologies: {
        languages: r?.languages,
        frameworks: r?.frameworks,
        databases: r?.databases,
        queues: r?.queues,
        caches: r?.caches,
      },
      metrics: {
        complexity: r?.complexity,
        coupling: r?.coupling,
        largestModules: (r?.modules as Array<{ name: string; lines: number }>)?.slice(0, 5),
        mostCoupled: (r?.coupling as { mostCoupled: unknown[] })?.mostCoupled,
        unusedFiles: r?.unusedFiles,
        unusedDependencies: r?.unusedDependencies,
      },
      ai: aiResult,
      architectureStyle: r?.architectureStyle,
      monorepo: r?.monorepo,
    };
  }
}
