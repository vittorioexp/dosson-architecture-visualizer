'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, GitBranch, FileArchive, FolderOpen, Trash2, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  sourceType: string;
  githubOwner?: string;
  githubRepo?: string;
  updatedAt: string;
  latestAnalysis?: { id: string; status: string; progress: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = () => {
    setLoading(true);
    api.getProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await api.deleteProject(id);
    loadProjects();
  };

  const handleReanalyze = async (id: string) => {
    await api.reanalyzeProject(id);
    loadProjects();
  };

  const sourceIcon = (type: string) => {
    switch (type) {
      case 'github': return <GitBranch className="h-4 w-4" />;
      case 'zip': return <FileArchive className="h-4 w-4" />;
      default: return <FolderOpen className="h-4 w-4" />;
    }
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="mt-1 text-muted-foreground">Manage your repository analyses</p>
          </div>
          <Link href="/projects/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No projects yet.</p>
              <Link href="/projects/new"><Button className="mt-4 gap-2"><Plus className="h-4 w-4" /> Create Project</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="group transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <Link href={`/projects/${project.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {sourceIcon(project.sourceType)}
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary">{project.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {project.sourceType === 'github' && project.githubOwner
                              ? `${project.githubOwner}/${project.githubRepo}`
                              : project.sourceType}
                          </p>
                        </div>
                      </Link>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReanalyze(project.id)}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(project.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {project.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{project.description}</p>}
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(project.updatedAt)}</span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${
                        project.latestAnalysis?.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        project.latestAnalysis?.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {project.latestAnalysis?.status || 'pending'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
