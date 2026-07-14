'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GitBranch, FileArchive, Upload } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [file, setFile] = useState<File | null>(null);

  const handleGithubSubmit = async () => {
    if (!name || !githubUrl) { setError('Name and GitHub URL are required'); return; }
    setLoading(true);
    setError('');
    try {
      const project = await api.createProject({ name, description, sourceType: 'github', githubUrl, githubBranch });
      router.push(`/projects/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!name || !file) { setError('Name and file are required'); return; }
    setLoading(true);
    setError('');
    try {
      const project = await api.uploadProject(file, name, description);
      router.push(`/projects/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Analysis</h1>
          <p className="mt-1 text-muted-foreground">Import a repository for architecture analysis</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Application" className="mt-1.5" />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" className="mt-1.5" />
          </div>
        </div>

        <Tabs defaultValue="github">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" className="gap-2"><GitBranch className="h-4 w-4" /> GitHub</TabsTrigger>
            <TabsTrigger value="upload" className="gap-2"><FileArchive className="h-4 w-4" /> Upload ZIP</TabsTrigger>
          </TabsList>

          <TabsContent value="github">
            <Card>
              <CardHeader>
                <CardTitle>GitHub Repository</CardTitle>
                <CardDescription>Analyze a public or private GitHub repository</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Repository URL</label>
                  <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/owner/repo" className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Branch</label>
                  <Input value={githubBranch} onChange={(e) => setGithubBranch(e.target.value)} placeholder="main" className="mt-1.5" />
                </div>
                <Button onClick={handleGithubSubmit} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Analyze Repository'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Archive</CardTitle>
                <CardDescription>Upload a ZIP file of your project source code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors hover:border-primary/50 hover:bg-accent/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">{file ? file.name : 'Click to select ZIP file'}</p>
                  <p className="text-xs text-muted-foreground">Max 100MB</p>
                  <input type="file" accept=".zip" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
                <Button onClick={handleUploadSubmit} disabled={loading || !file} className="w-full">
                  {loading ? 'Uploading...' : 'Upload & Analyze'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </motion.div>
    </AppShell>
  );
}
