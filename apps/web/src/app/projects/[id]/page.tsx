'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArchitectureGraph } from '@/components/graph/architecture-graph';
import { DashboardScores } from '@/components/dashboard/score-cards';
import { api } from '@/lib/api';
import type { ProjectSummary } from '@/lib/api';
import type { GraphNode, GraphEdge } from '@dosson-architecture-visualizer/shared';

const GRAPH_TYPES = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'module_dependency', label: 'Modules' },
  { id: 'service_map', label: 'Services' },
  { id: 'api', label: 'API Routes' },
  { id: 'folder_structure', label: 'Folders' },
  { id: 'database', label: 'Database' },
  { id: 'sequence', label: 'Sequence' },
];

interface DashboardState {
  scores: Record<string, number>;
  technologies: Record<string, unknown[]>;
  metrics: Record<string, unknown>;
  ai: Record<string, unknown>;
  architectureStyle: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [graphs, setGraphs] = useState<Array<{ type: string; nodes: GraphNode[]; edges: GraphEdge[] }>>([]);
  const [activeGraph, setActiveGraph] = useState('architecture');
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const proj = await api.getProject(projectId);
      setProject(proj);

      const analysis = proj.latestAnalysis;
      if (analysis?.status === 'completed') {
        const [dash, graphData] = await Promise.all([
          api.getDashboard(projectId),
          api.getGraphs(analysis.id),
        ]);
        setDashboard(dash);
        setGraphs(graphData.map((g) => ({
          type: g.type,
          nodes: g.nodes as GraphNode[],
          edges: g.edges as GraphEdge[],
        })));
        setPolling(false);
      } else if (analysis && !['completed', 'failed'].includes(analysis.status)) {
        setPolling(true);
      }
    } catch {
      // Handle error silently for demo
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [polling, loadData]);

  const currentGraph = graphs.find((g) => g.type === activeGraph);

  const handleExport = async (format: string) => {
    const analysis = project?.latestAnalysis?.id;
    if (!analysis) return;
    const result = await api.exportGraph(analysis, activeGraph, format);
    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeGraph}.${format === 'json' ? 'json' : format === 'mermaid' ? 'mmd' : 'puml'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const analysis = project?.latestAnalysis;

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {dashboard?.architectureStyle || 'Analyzing...'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => api.reanalyzeProject(projectId).then(loadData)}>
              <RefreshCw className="h-4 w-4" /> Re-analyze
            </Button>
            {currentGraph && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('mermaid')}>
                <Download className="h-4 w-4" /> Export
              </Button>
            )}
          </div>
        </div>

        {analysis && analysis.status !== 'completed' && analysis.status !== 'failed' && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{analysis.currentStep || analysis.status}...</span>
                <span className="text-muted-foreground">{analysis.progress}%</span>
              </div>
              <Progress value={analysis.progress} className="mt-3" />
            </CardContent>
          </Card>
        )}

        {analysis?.status === 'failed' && (
          <Card className="border-destructive/50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{analysis.error || 'Analysis failed'}</p>
            </CardContent>
          </Card>
        )}

        {dashboard && (
          <>
            <DashboardScores scores={dashboard.scores} />

            <Tabs value={activeGraph} onValueChange={setActiveGraph}>
              <TabsList className="flex-wrap">
                {GRAPH_TYPES.map((g) => (
                  <TabsTrigger key={g.id} value={g.id}>{g.label}</TabsTrigger>
                ))}
              </TabsList>
              {GRAPH_TYPES.map((g) => (
                <TabsContent key={g.id} value={g.id}>
                  <div className="h-[600px]">
                    {currentGraph ? (
                      <ArchitectureGraph nodes={currentGraph.nodes} edges={currentGraph.edges} />
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-xl border bg-card text-muted-foreground">
                        No graph data available
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {dashboard.ai && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Architecture Summary</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {(dashboard.ai as { architectureSummary?: string }).architectureSummary}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>AI Insights</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {((dashboard.ai as { refactoringSuggestions?: string[] }).refactoringSuggestions || []).slice(0, 5).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{s}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
