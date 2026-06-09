'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { ClientStatus, EntityType, PERMISSIONS, TaskStatus } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { DetailHeader } from '@/components/detail/detail-header';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import { TaskDialog } from '@/components/tasks/task-dialog';
import { ActivityDialog } from '@/components/activities/activity-dialog';
import { NoteDialog } from '@/components/notes/note-dialog';
import { CreateOpportunityDialog } from '@/components/opportunities/create-opportunity-dialog';
import { Badge } from '@/components/ui/badge';
import { CopyEmail } from '@/components/copy-email';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/file-upload';
import { ReactNode } from 'react';

const statusVariant: Record<ClientStatus, 'success' | 'secondary' | 'warning'> = {
  [ClientStatus.ACTIVE]: 'success',
  [ClientStatus.INACTIVE]: 'secondary',
  [ClientStatus.PROSPECT]: 'warning',
};

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="studio-label">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function CompactList({ children }: { children: ReactNode }) {
  return <Surface padding="none" className="divide-y studio-divider">{children}</Surface>;
}

function CompactRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3">{children}</div>;
}

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  website: string | null;
  description: string | null;
  company?: { id: string; name: string } | null;
  assignee?: { firstName: string; lastName: string } | null;
  createdAt: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { can } = usePermissions();
  const id = params.id as string;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const loadClient = useCallback(() => {
    apiClient
      .get<ClientDetail>(`/clients/${id}`)
      .then(setClient)
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Client not found</p>
        <Button asChild variant="link" size="sm" className="mt-2">
          <Link href="/clients">Back to clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <DetailHeader
        backHref="/clients"
        backLabel="Clients"
        title={client.name}
        description={client.company?.name ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[client.status]} className="capitalize">
              {client.status.toLowerCase()}
            </Badge>
            {(can(PERMISSIONS.CLIENTS_UPDATE) || can(PERMISSIONS.CLIENTS_DELETE)) && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <EditClientDialog
        clientId={id}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={loadClient}
        onDeleted={() => router.push('/clients')}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab client={client} />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsTab clientId={id} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab clientId={id} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab clientId={id} />
        </TabsContent>
        <TabsContent value="activities">
          <ActivitiesTab clientId={id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab clientId={id} />
        </TabsContent>
        <TabsContent value="opportunities">
          <OpportunitiesTab clientId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ client }: { client: ClientDetail }) {
  return (
    <Surface>
      <div className="grid gap-5 sm:grid-cols-2">
        <MetaField label="Email">
          {client.email ? <CopyEmail email={client.email} /> : '—'}
        </MetaField>
        <MetaField label="Phone">{client.phone ?? '—'}</MetaField>
        <MetaField label="Website">
          {client.website ? (
            <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline">
              {client.website}
            </a>
          ) : (
            '—'
          )}
        </MetaField>
        <MetaField label="Assignee">
          {client.assignee ? `${client.assignee.firstName} ${client.assignee.lastName}` : '—'}
        </MetaField>
        <MetaField label="Created">
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatDate(client.createdAt)}
          </span>
        </MetaField>
        {client.description && (
          <div className="sm:col-span-2">
            <MetaField label="Description">
              <span className="whitespace-pre-wrap">{client.description}</span>
            </MetaField>
          </div>
        )}
      </div>
    </Surface>
  );
}

function ContactsTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<{ id: string; firstName: string; lastName: string; email: string | null }[]>([]);

  useEffect(() => {
    apiClient
      .get<PaginatedResponse<{ id: string; firstName: string; lastName: string; email: string | null }>>(
        '/contacts',
        { clientId, limit: 50 },
      )
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  }, [clientId]);

  if (items.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">No contacts linked.</p>;
  }

  return (
    <CompactList>
      {items.map((c) => (
        <CompactRow key={c.id}>
          <Link href={`/contacts/${c.id}`} className="text-sm font-medium hover:underline">
            {c.firstName} {c.lastName}
          </Link>
          {c.email && <CopyEmail email={c.email} />}
        </CompactRow>
      ))}
    </CompactList>
  );
}

function TasksTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const [items, setItems] = useState<{ id: string; title: string; status: TaskStatus; dueDate: string | null }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    apiClient
      .get<PaginatedResponse<{ id: string; title: string; status: TaskStatus; dueDate: string | null }>>(
        '/tasks',
        { clientId, limit: 50 },
      )
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      {can(PERMISSIONS.TASKS_CREATE) && (
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New task
        </Button>
      )}
      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No tasks yet.</p>
      ) : (
        <CompactList>
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              onClick={() => {
                setSelectedId(t.id);
                setDialogOpen(true);
              }}
            >
              <span className="text-sm">{t.title}</span>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="outline">{t.status.replace('_', ' ')}</Badge>
                {t.dueDate && (
                  <span className="font-mono tabular-nums">{formatDate(t.dueDate)}</span>
                )}
              </div>
            </button>
          ))}
        </CompactList>
      )}
      <TaskDialog taskId={selectedId} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
      <TaskDialog taskId={null} open={createOpen} onOpenChange={setCreateOpen} defaultClientId={clientId} onSaved={load} />
    </div>
  );
}

function NotesTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const [items, setItems] = useState<{ id: string; title: string | null; content: string; createdAt: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    apiClient
      .get<PaginatedResponse<{ id: string; title: string | null; content: string; createdAt: string }>>(
        '/notes',
        { clientId, limit: 50 },
      )
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      {can(PERMISSIONS.NOTES_CREATE) && (
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New note
        </Button>
      )}
      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No notes yet.</p>
      ) : (
        <CompactList>
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-muted/40"
              onClick={() => {
                setSelectedId(n.id);
                setDialogOpen(true);
              }}
            >
              {n.title && <p className="text-sm font-medium">{n.title}</p>}
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{n.content}</p>
              <p className="mt-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                {formatRelativeDate(n.createdAt)}
              </p>
            </button>
          ))}
        </CompactList>
      )}
      <NoteDialog noteId={selectedId} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
      <NoteDialog noteId={null} open={createOpen} onOpenChange={setCreateOpen} defaultClientId={clientId} onSaved={load} />
    </div>
  );
}

function ActivitiesTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const [items, setItems] = useState<{ id: string; title: string; type: string; occurredAt: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    apiClient
      .get<PaginatedResponse<{ id: string; title: string; type: string; occurredAt: string }>>(
        '/activities',
        { clientId, limit: 50 },
      )
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      {can(PERMISSIONS.ACTIVITIES_CREATE) && (
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Log activity
        </Button>
      )}
      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No activities logged.</p>
      ) : (
        <CompactList>
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              onClick={() => {
                setSelectedId(a.id);
                setDialogOpen(true);
              }}
            >
              <div>
                <p className="text-sm">{a.title}</p>
                <p className="text-[11px] capitalize text-muted-foreground">{a.type.toLowerCase()}</p>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatRelativeDate(a.occurredAt)}
              </span>
            </button>
          ))}
        </CompactList>
      )}
      <ActivityDialog activityId={selectedId} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
      <ActivityDialog activityId={null} open={createOpen} onOpenChange={setCreateOpen} defaultClientId={clientId} onSaved={load} />
    </div>
  );
}

function DocumentsTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<{ id: string; fileName: string; size: number; createdAt: string }[]>([]);

  const load = () => {
    apiClient
      .get<PaginatedResponse<{ id: string; fileName: string; size: number; createdAt: string }>>(
        '/documents',
        { entityType: EntityType.CLIENT, entityId: clientId, limit: 50 },
      )
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, [clientId]);

  return (
    <div className="space-y-4">
      <Surface padding="sm">
        <FileUpload entityType={EntityType.CLIENT} entityId={clientId} onUploaded={load} />
      </Surface>
      {items.length === 0 ? (
        <p className="py-8 text-center text-[11px] text-muted-foreground">No documents uploaded.</p>
      ) : (
        <CompactList>
          {items.map((d) => (
            <CompactRow key={d.id}>
              <span className="text-sm">{d.fileName}</span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {(d.size / 1024).toFixed(1)} KB · {formatDate(d.createdAt)}
              </span>
            </CompactRow>
          ))}
        </CompactList>
      )}
    </div>
  );
}

function OpportunitiesTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const [items, setItems] = useState<{ id: string; title: string; value: number; status: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    apiClient
      .get<PaginatedResponse<{ id: string; title: string; value: number; status: string }>>(
        '/opportunities',
        { clientId, limit: 50 },
      )
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      {can(PERMISSIONS.OPPORTUNITIES_CREATE) && (
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New opportunity
        </Button>
      )}
      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No opportunities linked.</p>
      ) : (
        <CompactList>
          {items.map((o) => (
            <CompactRow key={o.id}>
              <Link href={`/opportunities?id=${o.id}`} className="text-sm hover:underline">
                {o.title}
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tabular-nums">{formatCurrency(o.value)}</span>
                <Badge variant="outline">{o.status}</Badge>
              </div>
            </CompactRow>
          ))}
        </CompactList>
      )}
      <CreateOpportunityDialog open={createOpen} onOpenChange={setCreateOpen} defaultClientId={clientId} onCreated={load} />
    </div>
  );
}
