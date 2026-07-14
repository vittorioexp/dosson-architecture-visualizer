import type { AnalysisStatus, SourceType } from './analysis';
import type { GraphData, GraphType } from './graph';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  createdAt: string;
  updatedAt: string;
  lastAnalyzedAt?: string;
  latestAnalysis?: AnalysisSummaryResponse;
}

export interface AnalysisSummaryResponse {
  id: string;
  status: AnalysisStatus;
  progress: number;
  currentStep?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AnalysisDetailResponse extends AnalysisSummaryResponse {
  error?: string;
  scores?: Record<string, number>;
  technologies?: string[];
}

export interface GraphResponse {
  id: string;
  type: GraphType;
  nodes: GraphData['nodes'];
  edges: GraphData['edges'];
  metadata: Record<string, unknown>;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  sourceType: SourceType;
  githubUrl?: string;
  githubBranch?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  checks: Record<string, { status: string; message?: string }>;
}
