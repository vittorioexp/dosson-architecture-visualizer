import { Injectable } from '@nestjs/common';
import { analyzeRepository } from '@dosson-architecture-visualizer/analyzers';
import type { AnalysisOutput } from '@dosson-architecture-visualizer/shared';
import { AiService } from '../../infrastructure/ai/ai.service';
import { createChildLogger } from '../../infrastructure/logging/logger';

export interface AnalysisPipelineResult {
  output: AnalysisOutput;
  duration: number;
}

@Injectable()
export class AnalysisService {
  private readonly log = createChildLogger('AnalysisService');

  constructor(private aiService: AiService) {}

  async runAnalysis(sandboxPath: string, includeAi = true): Promise<AnalysisPipelineResult> {
    const start = Date.now();
    this.log.info({ sandboxPath }, 'Starting analysis pipeline');

    const output = await analyzeRepository(sandboxPath);

    if (includeAi) {
      this.log.info('Running AI analysis');
      output.aiResult = await this.aiService.analyzeArchitecture(output.result as unknown as Record<string, unknown>);
    }

    const duration = Date.now() - start;
    this.log.info({ duration, files: output.result.complexity.totalFiles }, 'Analysis complete');
    return { output, duration };
  }
}
