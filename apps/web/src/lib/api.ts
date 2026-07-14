const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async getProjects(page = 1, pageSize = 20) {
    return this.request<{ data: ProjectSummary[]; total: number; page: number; pageSize: number }>(`/api/v1/projects?page=${page}&pageSize=${pageSize}`);
  }

  async getProject(id: string) {
    return this.request<ProjectSummary>(`/api/v1/projects/${id}`);
  }

  async createProject(data: { name: string; description?: string; sourceType: string; githubUrl?: string; githubBranch?: string }) {
    return this.request<ProjectSummary>('/api/v1/projects', { method: 'POST', body: JSON.stringify(data) });
  }

  async uploadProject(file: File, name: string, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) formData.append('description', description);
    return this.request<ProjectSummary>('/api/v1/projects/upload', { method: 'POST', body: formData, headers: {} });
  }

  async deleteProject(id: string) {
    return this.request(`/api/v1/projects/${id}`, { method: 'DELETE' });
  }

  async reanalyzeProject(id: string) {
    return this.request<ProjectSummary>(`/api/v1/projects/${id}/reanalyze`, { method: 'POST' });
  }

  async getAnalysis(id: string) {
    return this.request<AnalysisSummary>(`/api/v1/analyses/${id}`);
  }

  async getAnalysisResult(id: string) {
    return this.request<{ result: Record<string, unknown>; aiResult: Record<string, unknown> }>(`/api/v1/analyses/${id}/result`);
  }

  async getGraphs(analysisId: string) {
    return this.request<GraphData[]>(`/api/v1/analyses/${analysisId}/graphs`);
  }

  async getGraph(analysisId: string, type: string) {
    return this.request<GraphData>(`/api/v1/analyses/${analysisId}/graphs/${type}`);
  }

  async getDashboard(projectId: string) {
    return this.request<DashboardData>(`/api/v1/projects/${projectId}/dashboard`);
  }

  async exportGraph(analysisId: string, type: string, format: string) {
    return this.request<{ format: string; content: string }>(`/api/v1/analyses/${analysisId}/export/${type}/${format}`);
  }
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  sourceType: string;
  githubOwner?: string;
  githubRepo?: string;
  updatedAt: string;
  latestAnalysis?: { id: string; status: string; progress: number; currentStep?: string; error?: string };
}

export interface AnalysisSummary {
  id: string;
  status: string;
  progress: number;
  currentStep?: string;
  error?: string;
}

export interface GraphData {
  id: string;
  type: string;
  nodes: Array<{ id: string; type: string; label: string; path?: string; metadata?: Record<string, unknown> }>;
  edges: Array<{ id: string; source: string; target: string; type: string; label?: string }>;
  metadata: Record<string, unknown>;
}

export interface DashboardData {
  scores: Record<string, number>;
  technologies: Record<string, unknown[]>;
  metrics: Record<string, unknown>;
  ai: Record<string, unknown>;
  architectureStyle: string;
}

export const api = new ApiClient();
