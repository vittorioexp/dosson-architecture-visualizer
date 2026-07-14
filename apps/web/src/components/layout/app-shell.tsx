'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/command-palette';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const router = useRouter();

  const handleCommand = (action: string) => {
    switch (action) {
      case 'new-project':
        router.push('/projects/new');
        break;
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'toggle-theme':
        document.documentElement.classList.toggle('dark');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onCommandPalette={() => setCommandOpen(true)} />
      <main className="pl-64">
        <div className="min-h-screen p-8">{children}</div>
      </main>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onSelect={handleCommand} />
    </div>
  );
}
