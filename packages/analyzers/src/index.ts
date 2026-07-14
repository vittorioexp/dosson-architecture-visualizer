import type { AnalysisResult, AnalysisOutput } from '@dosson-architecture-visualizer/shared';
import type { PartialAnalysisResult } from './core/types';
import { AnalyzerRegistry } from './core/registry';
import { createAnalysisContext } from './core/context';
import { LanguageDetector } from './analyzers/language-detector';
import { FrameworkDetector } from './analyzers/framework-detector';
import { DependencyAnalyzer } from './analyzers/dependency-analyzer';
import { ImportAnalyzer } from './analyzers/import-analyzer';
import { ApiAnalyzer } from './analyzers/api-analyzer';
import { DatabaseAnalyzer } from './analyzers/database-analyzer';
import { DockerAnalyzer } from './analyzers/docker-analyzer';
import { TerraformAnalyzer } from './analyzers/terraform-analyzer';
import { GitAnalyzer } from './analyzers/git-analyzer';
import { ReadmeAnalyzer } from './analyzers/readme-analyzer';
import { SecurityAnalyzer } from './analyzers/security-analyzer';
import { ComplexityAnalyzer } from './analyzers/complexity-analyzer';
import { DocumentationAnalyzer } from './analyzers/documentation-analyzer';
import { InfrastructureAnalyzer } from './analyzers/infrastructure-analyzer';
import { EnvironmentAnalyzer } from './analyzers/environment-analyzer';
import { ArchitectureStyleDetector } from './analyzers/architecture-style-detector';
import { GraphBuilder } from './graph/graph-builder';

export function createDefaultRegistry(): AnalyzerRegistry {
  const registry = new AnalyzerRegistry();
  registry.register(new LanguageDetector());
  registry.register(new FrameworkDetector());
  registry.register(new DependencyAnalyzer());
  registry.register(new ArchitectureStyleDetector());
  registry.register(new ImportAnalyzer());
  registry.register(new EnvironmentAnalyzer());
  registry.register(new ApiAnalyzer());
  registry.register(new DatabaseAnalyzer());
  registry.register(new InfrastructureAnalyzer());
  registry.register(new DockerAnalyzer());
  registry.register(new TerraformAnalyzer());
  registry.register(new GitAnalyzer());
  registry.register(new ReadmeAnalyzer());
  registry.register(new SecurityAnalyzer());
  registry.register(new ComplexityAnalyzer());
  registry.register(new DocumentationAnalyzer());
  return registry;
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

  // Dependency health from unused deps
  const unusedDeps = partials.flatMap((p) => p.unusedDependencies || []);
  if (unusedDeps.length > 0) {
    merged.dependencyHealth = Math.max(0, 100 - unusedDeps.length * 5);
  } else {
    merged.dependencyHealth = merged.dependencyHealth || 85;
  }

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

export async function analyzeRepository(rootPath: string, registry?: AnalyzerRegistry): Promise<AnalysisOutput> {
  const context = createAnalysisContext(rootPath);
  const reg = registry || createDefaultRegistry();
  const { results, merged } = await reg.runAll(context);

  const base = createEmptyResult();
  const result: AnalysisResult = {
    ...base,
    ...merged,
    scores: mergeScores(results.map((r) => r.result)),
  };

  const graphBuilder = new GraphBuilder();
  const graphs = graphBuilder.buildAll(result);

  return { result, graphs };
}

export * from './core/types';
export * from './core/registry';
export * from './core/context';
export * from './graph/graph-builder';
export * from './export/exporters';
