import type { GraphData, GraphType } from './graph';

export type AnalysisStatus =
  | 'pending'
  | 'queued'
  | 'ingesting'
  | 'indexing'
  | 'analyzing'
  | 'generating_graphs'
  | 'ai_processing'
  | 'completed'
  | 'failed';

export type SourceType = 'local' | 'zip' | 'github';

export interface DetectedTechnology {
  name: string;
  category: string;
  version?: string;
  confidence: number;
  evidence?: string[];
}

export interface DetectedService {
  name: string;
  type: string;
  path?: string;
  port?: number;
  dependencies?: string[];
}

export interface DetectedApi {
  method: string;
  path: string;
  handler?: string;
  file?: string;
  framework?: string;
}

export interface DetectedDatabase {
  type: string;
  name?: string;
  orm?: string;
  tables?: string[];
}

export interface DetectedEnvVar {
  name: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  sensitive: boolean;
}

export interface ModuleInfo {
  name: string;
  path: string;
  files: number;
  lines: number;
  imports: string[];
  exports: string[];
  complexity: number;
  coupling: number;
}

export interface FileInfo {
  path: string;
  language: string;
  lines: number;
  complexity: number;
  imports: string[];
  exports: string[];
}

export interface CircularDependency {
  cycle: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface ComplexityMetrics {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  maxComplexity: number;
  cyclomaticComplexity: number;
}

export interface CouplingMetrics {
  afferentCoupling: Record<string, number>;
  efferentCoupling: Record<string, number>;
  mostCoupled: Array<{ module: string; score: number }>;
}

export interface SecurityFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  file?: string;
  line?: number;
}

export interface DashboardScores {
  architecture: number;
  complexity: number;
  maintainability: number;
  security: number;
  testCoverage: number;
  documentation: number;
  dependencyHealth: number;
}

export interface AnalysisResult {
  languages: DetectedTechnology[];
  frameworks: DetectedTechnology[];
  packageManagers: DetectedTechnology[];
  architectureStyle: string;
  services: DetectedService[];
  modules: ModuleInfo[];
  apis: DetectedApi[];
  databases: DetectedDatabase[];
  queues: DetectedTechnology[];
  caches: DetectedTechnology[];
  authentication: DetectedTechnology[];
  externalServices: DetectedTechnology[];
  environmentVariables: DetectedEnvVar[];
  docker: DetectedTechnology[];
  kubernetes: DetectedTechnology[];
  terraform: DetectedTechnology[];
  cicd: DetectedTechnology[];
  cloudProviders: DetectedTechnology[];
  monorepo: {
    isMonorepo: boolean;
    tool?: string;
    packages?: string[];
  };
  files: FileInfo[];
  complexity: ComplexityMetrics;
  coupling: CouplingMetrics;
  circularDependencies: CircularDependency[];
  unusedFiles: string[];
  unusedDependencies: string[];
  securityFindings: SecurityFinding[];
  scores: DashboardScores;
  folderStructure: Array<{ path: string; type: string; children?: number }>;
}

export interface AiAnalysisResult {
  architectureSummary: string;
  projectOverview: string;
  businessDomain: string;
  criticalComponents: string[];
  complexityAnalysis: string;
  couplingAnalysis: string;
  codeSmells: string[];
  deadCodeCandidates: string[];
  refactoringSuggestions: string[];
  scalabilityRisks: string[];
  securityRisks: string[];
  performanceRisks: string[];
  technicalDebt: string;
  missingTests: string[];
  missingDocumentation: string[];
}

export interface AnalysisOutput {
  result: AnalysisResult;
  graphs: Record<GraphType, GraphData>;
  aiResult?: AiAnalysisResult;
}
