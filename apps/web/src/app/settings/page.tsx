'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Configure your account and API access</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Authentication</CardTitle>
            <CardDescription>Configure your API token for backend access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Session Token</label>
              <Input
                placeholder="Paste your session token"
                className="mt-1.5 font-mono text-xs"
                onChange={(e) => {
                  if (e.target.value) {
                    const { api } = require('@/lib/api');
                    api.setToken(e.target.value);
                  }
                }}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Run <code className="rounded bg-muted px-1">pnpm db:seed</code> to get a demo token
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>AI analysis is configured server-side via environment variables</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file to enable AI-powered architecture insights.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
