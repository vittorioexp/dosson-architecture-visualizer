import { describe, it, expect } from 'vitest';
import { generateHtmlReport } from './html-report';
import type { AnalysisOutput } from '@dosson-architecture-visualizer/shared';

const minimalOutput: AnalysisOutput = {
  result: {
    languages: [{ name: 'TypeScript', category: 'language', confidence: 1 }],
    frameworks: [],
    packageManagers: [],
    architectureStyle: 'Monolithic',
    services: [],
    modules: [],
    apis: [],
    databases: [],
    queues: [],
    caches: [],
    authentication: [],
    externalServices: [],
    environmentVariables: [],
    docker: [],
    kubernetes: [],
    terraform: [],
    cicd: [],
    cloudProviders: [],
    monorepo: { isMonorepo: false },
    files: [],
    complexity: { totalFiles: 1, totalLines: 10, averageComplexity: 1, maxComplexity: 1, cyclomaticComplexity: 1 },
    coupling: { afferentCoupling: {}, efferentCoupling: {}, mostCoupled: [] },
    circularDependencies: [],
    unusedFiles: [],
    unusedDependencies: [],
    securityFindings: [],
    scores: { architecture: 70, complexity: 80, maintainability: 75, security: 90, testCoverage: 50, documentation: 60, dependencyHealth: 85 },
    folderStructure: [],
  },
  graphs: {
    architecture: { nodes: [], edges: [] },
    module_dependency: { nodes: [], edges: [] },
    service_map: { nodes: [], edges: [] },
    api: { nodes: [], edges: [] },
    folder_structure: { nodes: [], edges: [] },
    database: { nodes: [], edges: [] },
    sequence: { nodes: [], edges: [] },
  },
};

describe('generateHtmlReport', () => {
  it('produces valid HTML', () => {
    const html = generateHtmlReport(minimalOutput, 'Test');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Dosson');
    expect(html).toContain('Monolithic');
  });
});
