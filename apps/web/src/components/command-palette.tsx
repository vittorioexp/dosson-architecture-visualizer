'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (action: string) => void;
}

export function CommandPalette({ open, onOpenChange, onSelect }: CommandPaletteProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border bg-popover p-0 shadow-2xl">
        <Command className="rounded-xl">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search commands..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
            <Command.Group heading="Actions">
              {[
                { id: 'new-project', label: 'New Project' },
                { id: 'dashboard', label: 'Go to Dashboard' },
                { id: 'toggle-theme', label: 'Toggle Theme' },
              ].map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={() => { onSelect(item.id); onOpenChange(false); }}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none',
                    'aria-selected:bg-accent aria-selected:text-accent-foreground',
                  )}
                >
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
