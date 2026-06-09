'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate } from '@/lib/utils';

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { can } = usePermissions();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<NotificationRow>>('/notifications', {
        limit: 50,
      });
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    if (!can(PERMISSIONS.NOTIFICATIONS_UPDATE)) return;
    await apiClient.patch(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    if (!can(PERMISSIONS.NOTIFICATIONS_UPDATE)) return;
    await apiClient.patch('/notifications/read-all');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Workspace alerts and reminders"
        actions={
          can(PERMISSIONS.NOTIFICATIONS_UPDATE) ? (
            <Button size="sm" variant="outline" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          ) : undefined
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No notifications.</p>
      ) : (
        <Surface padding="none" className="divide-y studio-divider">
          {items.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read && <Badge variant="secondary">New</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {formatRelativeDate(n.createdAt)}
                </p>
              </div>
              {!n.read && can(PERMISSIONS.NOTIFICATIONS_UPDATE) && (
                <Button size="sm" variant="ghost" onClick={() => void markRead(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </Surface>
      )}
    </div>
  );
}
