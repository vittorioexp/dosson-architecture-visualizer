import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiAnalysisResult } from '@dosson-architecture-visualizer/shared';
import type { AiCompletionRequest, AiProvider, IAiService } from '../../domain/interfaces/ai.interface';
import type { EnvConfig } from '../../config/env.validation';
import { createChildLogger } from '../logging/logger';

class OpenAiCompatibleProvider implements AiProvider {
  readonly name: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly log = createChildLogger('OpenAiProvider');

  constructor(name: string, apiKey: string, baseUrl: string, model: string) {
    this.name = name;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async complete(request: AiCompletionRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.log.error({ status: response.status, error }, 'AI provider error');
      throw new Error(`AI provider ${this.name} failed: ${response.status}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }
}

@Injectable()
export class AiService implements IAiService {
  private readonly log = createChildLogger('AiService');
  private providers: Map<string, AiProvider> = new Map();
  private defaultProvider: string;

  constructor(private config: ConfigService<EnvConfig>) {
    this.defaultProvider = this.config.get('AI_DEFAULT_PROVIDER', { infer: true })!;

    const openaiKey = this.config.get('OPENAI_API_KEY', { infer: true });
    if (openaiKey) {
      this.providers.set('openai', new OpenAiCompatibleProvider(
        'openai',
        openaiKey,
        this.config.get('OPENAI_BASE_URL', { infer: true })!,
        this.config.get('OPENAI_MODEL', { infer: true })!,
      ));
    }

    const anthropicKey = this.config.get('ANTHROPIC_API_KEY', { infer: true });
    if (anthropicKey) {
      this.providers.set('anthropic', new OpenAiCompatibleProvider(
        'anthropic',
        anthropicKey,
        this.config.get('ANTHROPIC_BASE_URL', { infer: true })!,
        this.config.get('ANTHROPIC_MODEL', { infer: true })!,
      ));
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async analyzeArchitecture(analysisData: Record<string, unknown>): Promise<AiAnalysisResult> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      this.log.warn('No AI provider configured, returning heuristic analysis');
      return this.heuristicAnalysis(analysisData);
    }

    const systemPrompt = `You are a senior software architect analyzing a codebase. 
Provide detailed, actionable insights. Respond ONLY with valid JSON matching the required schema.`;

    const userPrompt = `Analyze this software project and provide architecture insights:

${JSON.stringify(analysisData, null, 2).slice(0, 12000)}

Respond with JSON:
{
  "architectureSummary": "string",
  "projectOverview": "string",
  "businessDomain": "string",
  "criticalComponents": ["string"],
  "complexityAnalysis": "string",
  "couplingAnalysis": "string",
  "codeSmells": ["string"],
  "deadCodeCandidates": ["string"],
  "refactoringSuggestions": ["string"],
  "scalabilityRisks": ["string"],
  "securityRisks": ["string"],
  "performanceRisks": ["string"],
  "technicalDebt": "string",
  "missingTests": ["string"],
  "missingDocumentation": ["string"]
}`;

    try {
      const response = await provider.complete({ systemPrompt, userPrompt });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AiAnalysisResult;
      }
    } catch (error) {
      this.log.error({ error }, 'AI analysis failed, falling back to heuristic');
    }

    return this.heuristicAnalysis(analysisData);
  }

  private heuristicAnalysis(data: Record<string, unknown>): AiAnalysisResult {
    const result = data as {
      architectureStyle?: string;
      languages?: Array<{ name: string }>;
      frameworks?: Array<{ name: string }>;
      modules?: Array<{ name: string; complexity: number }>;
      securityFindings?: Array<{ message: string; severity: string }>;
      circularDependencies?: Array<{ cycle: string[] }>;
      unusedFiles?: string[];
      unusedDependencies?: string[];
      scores?: Record<string, number>;
    };

    const langs = result.languages?.map((l) => l.name).join(', ') || 'Unknown';
    const frameworks = result.frameworks?.map((f) => f.name).join(', ') || 'Unknown';

    return {
      architectureSummary: `This project follows a ${result.architectureStyle || 'standard'} architecture pattern, built primarily with ${langs} and ${frameworks}.`,
      projectOverview: `A software project with ${result.modules?.length || 0} modules analyzed.`,
      businessDomain: 'Software Development / Technology',
      criticalComponents: result.modules?.sort((a, b) => b.complexity - a.complexity).slice(0, 5).map((m) => m.name) || [],
      complexityAnalysis: `Average complexity score: ${result.scores?.complexity || 'N/A'}. ${result.modules?.length || 0} modules detected.`,
      couplingAnalysis: `${result.circularDependencies?.length || 0} circular dependencies found.`,
      codeSmells: result.circularDependencies?.length ? ['Circular dependencies detected'] : [],
      deadCodeCandidates: result.unusedFiles?.slice(0, 10) || [],
      refactoringSuggestions: [
        ...(result.circularDependencies?.length ? ['Break circular dependencies by introducing interfaces'] : []),
        ...(result.unusedDependencies?.length ? ['Remove unused dependencies'] : []),
        'Consider adding integration tests for critical paths',
      ],
      scalabilityRisks: result.modules?.filter((m) => m.complexity > 50).map((m) => `High complexity in ${m.name}`) || [],
      securityRisks: result.securityFindings?.map((f) => `${f.severity}: ${f.message}`) || [],
      performanceRisks: [],
      technicalDebt: `Security score: ${result.scores?.security || 'N/A'}, Maintainability: ${result.scores?.maintainability || 'N/A'}`,
      missingTests: ['Integration test coverage appears limited'],
      missingDocumentation: result.scores?.documentation && result.scores.documentation < 50 ? ['README needs improvement', 'API documentation missing'] : [],
    };
  }
}
