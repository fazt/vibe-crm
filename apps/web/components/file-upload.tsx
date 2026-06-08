'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { EntityType } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  entityType: EntityType;
  entityId: string;
  onUploaded?: () => void;
}

export function FileUpload({ entityType, entityId, onUploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const presign = await apiClient.post<{ uploadUrl: string; key: string }>('/documents/presign', {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        entityType,
        entityId,
      });

      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      await apiClient.post('/documents/confirm', {
        key: presign.key,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        entityType,
        entityId,
      });

      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : 'Upload file'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
