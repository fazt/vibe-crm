'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { OpportunityStatus, PERMISSIONS } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

interface OpportunityDetail {
  id: string;
  title: string;
  value: number;
  probability: number;
  status: OpportunityStatus;
  description: string | null;
  expectedCloseDate: string | null;
  stageId: string;
  clientId: string | null;
  contactId: string | null;
  assigneeId: string | null;
  stage?: { id: string; name: string; color: string };
  client?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  assignee?: { id: string; firstName: string; lastName: string } | null;
}

interface OpportunityDetailDialogProps {
  opportunityId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const labelClass = 'studio-label';
const selectTriggerClass = 'studio-inset rounded-lg';

export function OpportunityDetailDialog({
  opportunityId,
  open,
  onOpenChange,
  onUpdated,
}: OpportunityDetailDialogProps) {
  const { can } = usePermissions();
  const { members } = useWorkspaceMembers();
  const [detail, setDetail] = useState<OpportunityDetail | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [probability, setProbability] = useState('');
  const [description, setDescription] = useState('');
  const [stageId, setStageId] = useState('');
  const [clientId, setClientId] = useState('');
  const [contactId, setContactId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');

  const canUpdate = can(PERMISSIONS.OPPORTUNITIES_UPDATE);
  const canDelete = can(PERMISSIONS.OPPORTUNITIES_DELETE);

  const loadOptions = useCallback(async () => {
    const [st, cl] = await Promise.all([
      apiClient.get<PipelineStage[]>('/pipeline/stages'),
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/clients', { limit: 100 }),
    ]);
    setStages(st);
    setClients(cl.data);
  }, []);

  const load = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<OpportunityDetail>(`/opportunities/${opportunityId}`);
      setDetail(data);
      setTitle(data.title);
      setValue(String(data.value));
      setProbability(String(data.probability));
      setDescription(data.description ?? '');
      setStageId(data.stageId);
      setClientId(data.clientId ?? '');
      setContactId(data.contactId ?? '');
      setAssigneeId(data.assigneeId ?? '');
      setExpectedCloseDate(
        data.expectedCloseDate ? new Date(data.expectedCloseDate).toISOString().slice(0, 10) : '',
      );
    } catch {
      setError('Failed to load opportunity');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    if (open && opportunityId) {
      void loadOptions();
      void load();
    }
  }, [open, opportunityId, load, loadOptions]);

  useEffect(() => {
    if (!clientId) {
      setContacts([]);
      return;
    }
    apiClient
      .get<PaginatedResponse<{ id: string; firstName: string; lastName: string }>>('/contacts', {
        clientId,
        limit: 50,
      })
      .then((res) => setContacts(res.data))
      .catch(() => setContacts([]));
  }, [clientId]);

  const handleSave = async () => {
    if (!opportunityId || !canUpdate) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.patch(`/opportunities/${opportunityId}`, {
        title,
        value: Number(value) || 0,
        probability: Number(probability) || 0,
        description: description || undefined,
        stageId: stageId || undefined,
        clientId: clientId || undefined,
        contactId: contactId || undefined,
        assigneeId: assigneeId || undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      });
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!opportunityId || !canDelete) return;
    if (!confirm('Delete this opportunity?')) return;
    setDeleting(true);
    setError('');
    try {
      await apiClient.delete(`/opportunities/${opportunityId}`);
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const readOnly = !canUpdate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loading ? 'Loading...' : detail?.title ?? 'Opportunity'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading details...</p>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {detail.stage && (
                <Badge variant="outline" style={{ borderColor: detail.stage.color }}>
                  {detail.stage.name}
                </Badge>
              )}
              <Badge variant="secondary">{detail.status}</Badge>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Stage</label>
              <Select value={stageId} onValueChange={setStageId} disabled={readOnly}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Value</label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  type="number"
                  min={0}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Probability %</label>
                <Input
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                  type="number"
                  min={0}
                  max={100}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Expected close</label>
              <Input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Client</label>
              <Select
                value={clientId}
                onValueChange={(v) => {
                  setClientId(v);
                  setContactId('');
                }}
                disabled={readOnly}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Contact</label>
              <Select value={contactId} onValueChange={setContactId} disabled={readOnly || !clientId}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Assignee</label>
              <Select value={assigneeId} onValueChange={setAssigneeId} disabled={readOnly}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={readOnly}
              />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className={labelClass}>Current value</dt>
                <dd className="mt-1 font-mono tabular-nums">{formatCurrency(detail.value)}</dd>
              </div>
              <div>
                <dt className={labelClass}>Created close</dt>
                <dd className="mt-1 font-mono tabular-nums">{formatDate(detail.expectedCloseDate)}</dd>
              </div>
            </dl>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex justify-between gap-2">
              {canDelete ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {canUpdate && (
                  <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          error && <p className="text-sm text-destructive">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
