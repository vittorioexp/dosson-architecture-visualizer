import type { AnalysisResult, AnalysisOutput } from '@dosson-architecture-visualizer/shared';
import type { PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';
import { AnalyzerRegistry } from '@dosson-architecture-visualizer/plugin-sdk';
import { createAnalysisContext } from '@dosson-architecture-visualizer/parser';
import { GraphBuilder } from '@dosson-architecture-visualizer/graph';
import { createDefaultRegistry } from './default-registry';

export interface AnalyzeOptions {
  registry?: AnalyzerRegistry;
  includeGraphs?: boolean;
}

function mergeScores(partials: Array<Partial<AnalysisResult>>): AnalysisResult['scores'] {
  const scoreKeys = ['architecture', 'complexity', 'maintainability', 'security', 'testCoverage', 'documentation', 'dependencyHealth'] as const;
  const merged: AnalysisResult['scores'] = {
    architecture: 0, complexity: 0, maintainability: 0, security: 0,
    testCoverage: 0, documentation: 0, dependencyHealth: 0,
  };

  for (const key of scoreKeys) {
    const values = partials.map((p) => p.scores?.[key]).filter((v): v is number => v !== undefined && v > 0);
    merged[key] = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }

  const unusedDeps = partials.flatMap((p) => p.unusedDependencies || []);
  merged.dependencyHealth = unusedDeps.length > 0 ? Math.max(0, 100 - unusedDeps.length * 5) : (merged.dependencyHealth || 85);

  return merged;
}

function createEmptyResult(): AnalysisResult {
  return {
    languages: [], frameworks: [], packageManagers: [], architectureStyle: 'Unknown',
    services: [], modules: [], apis: [], databases: [], queues: [], caches: [],
    authentication: [], externalServices: [], environmentVariables: [],
    docker: [], kubernetes: [], terraform: [], cicd: [], cloudProviders: [],
    monorepo: { isMonorepo: false }, files: [],
    complexity: { totalFiles: 0, totalLines: 0, averageComplexity: 0, maxComplexity: 0, cyclomaticComplexity: 0 },
    coupling: { afferentCoupling: {}, efferentCoupling: {}, mostCoupled: [] },
    circularDependencies: [], unusedFiles: [], unusedDependencies: [],
    securityFindings: [],
    scores: { architecture: 0, complexity: 0, maintainability: 0, security: 0, testCoverage: 0, documentation: 0, dependencyHealth: 0 },
    folderStructure: [],
  };
}

export async function analyzeRepository(rootPath: string, options: AnalyzeOptions = {}): Promise<AnalysisOutput> {
  const { registry = createDefaultRegistry(), includeGraphs = true } = options;
  const context = createAnalysisContext(rootPath);
  const { results, merged } = await registry.runAll(context);

  const result: AnalysisResult = {
    ...createEmptyResult(),
    ...merged,
    scores: mergeScores(results.map((r) => r.result)),
  };

  const graphs = includeGraphs ? new GraphBuilder().buildAll(result) : ({} as AnalysisOutput['graphs']);

  return { result, graphs };
}

export { createDefaultRegistry };
