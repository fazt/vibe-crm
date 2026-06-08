'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { apiClient, ApiRequestError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OpportunityDetail {
  id: string;
  title: string;
  value: number;
  probability: number;
  status: string;
  description: string | null;
  expectedCloseDate: string | null;
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

export function OpportunityDetailDialog({
  opportunityId,
  open,
  onOpenChange,
  onUpdated,
}: OpportunityDetailDialogProps) {
  const [detail, setDetail] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<OpportunityDetail>(`/opportunities/${opportunityId}`);
      setDetail(data);
      setTitle(data.title);
      setValue(String(data.value));
      setDescription(data.description ?? '');
    } catch {
      setError('Failed to load opportunity');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    if (open && opportunityId) void load();
  }, [open, opportunityId, load]);

  const handleSave = async () => {
    if (!opportunityId) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.patch(`/opportunities/${opportunityId}`, {
        title,
        value: Number(value) || 0,
        description: description || undefined,
      });
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
              <label className="studio-label">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="studio-label">Value</label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" min={0} />
            </div>

            <div className="space-y-2">
              <label className="studio-label">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="studio-label">Client</dt>
                <dd className="mt-1">{detail.client?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="studio-label">Contact</dt>
                <dd className="mt-1">
                  {detail.contact ? `${detail.contact.firstName} ${detail.contact.lastName}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="studio-label">Assignee</dt>
                <dd className="mt-1">
                  {detail.assignee ? `${detail.assignee.firstName} ${detail.assignee.lastName}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="studio-label">Close date</dt>
                <dd className="mt-1 font-mono tabular-nums">{formatDate(detail.expectedCloseDate)}</dd>
              </div>
              <div>
                <dt className="studio-label">Probability</dt>
                <dd className="mt-1">{detail.probability}%</dd>
              </div>
              <div>
                <dt className="studio-label">Current value</dt>
                <dd className="mt-1 font-mono tabular-nums">{formatCurrency(detail.value)}</dd>
              </div>
            </dl>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          error && <p className="text-sm text-destructive">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
