'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Building2,
  CheckSquare,
  Target,
  UserCircle,
  Users,
} from 'lucide-react';
import type { SearchResult } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { useUiStore } from '@/stores/ui-store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const typeIcons: Record<string, React.ElementType> = {
  client: Users,
  contact: UserCircle,
  opportunity: Target,
  task: CheckSquare,
  company: Building2,
  activity: Activity,
};

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setCommandOpen]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<SearchResult[]>('/search', { q: query, limit: 20 });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = useCallback(
    (url: string) => {
      setCommandOpen(false);
      router.push(url);
    },
    [router, setCommandOpen],
  );

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    const key = item.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setCommandOpen}>
      <CommandInput
        placeholder="Search clients, contacts, opportunities..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!loading && query && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!query && <CommandEmpty>Type to search across your workspace.</CommandEmpty>}
        {Object.entries(grouped).map(([type, items]) => {
          const Icon = typeIcons[type] ?? Users;
          return (
            <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}>
              {items.map((item) => (
                <CommandItem key={`${item.type}-${item.id}`} onSelect={() => runCommand(item.url)}>
                  <div className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border studio-divider bg-amber-950/25">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{item.title}</span>
                    {item.subtitle && (
                      <span className="font-mono text-[11px] text-muted-foreground">{item.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
