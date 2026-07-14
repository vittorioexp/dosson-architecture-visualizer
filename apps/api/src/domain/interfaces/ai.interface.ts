import type { AiAnalysisResult } from '@dosson-architecture-visualizer/shared';

export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiProvider {
  name: string;
  complete(request: AiCompletionRequest): Promise<string>;
}

export interface IAiService {
  analyzeArchitecture(analysisData: Record<string, unknown>): Promise<AiAnalysisResult>;
  getAvailableProviders(): string[];
}
