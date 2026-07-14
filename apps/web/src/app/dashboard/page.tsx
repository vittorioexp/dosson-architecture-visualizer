'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, GitBranch, FileArchive, FolderOpen } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  sourceType: string;
  updatedAt: string;
  latestAnalysis?: { status: string; progress: number };
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProjects(1, 5)
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const sourceIcon = (type: string) => {
    switch (type) {
      case 'github': return <GitBranch className="h-4 w-4" />;
      case 'zip': return <FileArchive className="h-4 w-4" />;
      default: return <FolderOpen className="h-4 w-4" />;
    }
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Overview of your architecture analyses</p>
          </div>
          <Link href="/projects/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Analysis
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: 'Total Projects', value: projects.length, color: 'text-blue-500' },
            { label: 'Completed', value: projects.filter((p) => p.latestAnalysis?.status === 'completed').length, color: 'text-emerald-500' },
            { label: 'In Progress', value: projects.filter((p) => p.latestAnalysis && !['completed', 'failed'].includes(p.latestAnalysis.status)).length, color: 'text-amber-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`mt-1 text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your latest architecture analyses</CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No projects yet. Create your first analysis.</p>
                <Link href="/projects/new">
                  <Button className="mt-4 gap-2"><Plus className="h-4 w-4" /> New Analysis</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {sourceIcon(project.sourceType)}
                        </div>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(project.updatedAt)}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        project.latestAnalysis?.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        project.latestAnalysis?.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {project.latestAnalysis?.status || 'pending'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppShell>
  );
}
