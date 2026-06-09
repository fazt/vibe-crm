'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { PERMISSIONS } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { DetailHeader } from '@/components/detail/detail-header';
import { EditContactDialog } from '@/components/contacts/edit-contact-dialog';
import { CopyEmail } from '@/components/copy-email';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ContactDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
  client?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
}

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="studio-label">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { can } = usePermissions();
  const id = params.id as string;
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(() => {
    apiClient
      .get<ContactDetail>(`/contacts/${id}`)
      .then(setContact)
      .catch(() => setContact(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Contact not found</p>
        <Button asChild variant="link" size="sm" className="mt-2">
          <Link href="/contacts">Back to contacts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <DetailHeader
        backHref="/contacts"
        backLabel="Contacts"
        title={`${contact.firstName} ${contact.lastName}`}
        description={contact.jobTitle ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {contact.isPrimary && <Badge variant="outline">Primary</Badge>}
            {(can(PERMISSIONS.CONTACTS_UPDATE) || can(PERMISSIONS.CONTACTS_DELETE)) && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <Surface>
        <div className="grid gap-5 sm:grid-cols-2">
          <MetaField label="Email">
            {contact.email ? <CopyEmail email={contact.email} /> : '—'}
          </MetaField>
          <MetaField label="Phone">{contact.phone ?? '—'}</MetaField>
          <MetaField label="Client">
            {contact.client ? (
              <Link href={`/clients/${contact.client.id}`} className="hover:underline">
                {contact.client.name}
              </Link>
            ) : (
              '—'
            )}
          </MetaField>
          <MetaField label="Company">
            {contact.company ? (
              <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                {contact.company.name}
              </Link>
            ) : (
              '—'
            )}
          </MetaField>
        </div>
      </Surface>

      <EditContactDialog
        contactId={id}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={load}
        onDeleted={() => router.push('/contacts')}
      />
    </div>
  );
}
