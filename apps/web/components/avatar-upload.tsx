'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import type { AuthUser } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  user: Pick<AuthUser, 'firstName' | 'lastName' | 'avatarUrl'> | null;
  onUpdated: (user: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>) => void;
}

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export function AvatarUpload({ user, onUpdated }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const presign = await apiClient.post<{
        uploadUrl: string;
        key: string;
        uploadHeaders?: Record<string, string>;
      }>(
        '/users/me/avatar/presign',
        {
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        },
        { skipWorkspace: true },
      );

      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          ...presign.uploadHeaders,
        },
      });

      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      const updated = await apiClient.post<
        Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>
      >(
        '/users/me/avatar/confirm',
        {
          key: presign.key,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        },
        { skipWorkspace: true },
      );

      onUpdated(updated);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);
    try {
      const updated = await apiClient.delete<
        Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>
      >('/users/me/avatar', { skipWorkspace: true });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Could not remove avatar');
    } finally {
      setRemoving(false);
    }
  }

  const busy = uploading || removing;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Avatar className="h-16 w-16">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt="Profile photo" />
        <AvatarFallback className="text-sm">{initials(user?.firstName, user?.lastName)}</AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="mr-1.5 h-3.5 w-3.5" />
            )}
            {uploading ? 'Uploading…' : 'Change photo'}
          </Button>
          {user?.avatarUrl && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={handleRemove}>
              {removing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">JPG, PNG or WebP. Max 2 MB.</p>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    </div>
  );
}
