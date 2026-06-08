import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ALLOWED_AVATAR_TYPES, ALLOWED_FILE_TYPES } from '@vibe-crm/shared';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string | undefined;
  private readonly publicUrlBase: string | undefined;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('SPACES_BUCKET') ?? 'vibe-crm';
    this.endpoint = this.config.get<string>('SPACES_ENDPOINT');
    this.publicUrlBase = this.config.get<string>('SPACES_PUBLIC_URL');
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: this.config.get<string>('SPACES_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('SPACES_KEY') ?? '',
        secretAccessKey: this.config.get<string>('SPACES_SECRET') ?? '',
      },
      forcePathStyle: Boolean(this.endpoint),
    });
  }

  validateMimeType(mimeType: string): void {
    if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
      throw new BadRequestException(`File type not allowed: ${mimeType}`);
    }
  }

  validateAvatarMimeType(mimeType: string): void {
    if (!ALLOWED_AVATAR_TYPES.includes(mimeType as (typeof ALLOWED_AVATAR_TYPES)[number])) {
      throw new BadRequestException(`Avatar type not allowed: ${mimeType}`);
    }
  }

  buildAvatarKey(userId: string, fileName: string): string {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `users/${userId}/avatar/${Date.now()}-${safe}`;
  }

  buildKey(
    workspaceId: string,
    entityType: string,
    entityId: string,
    fileName: string,
  ): string {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${workspaceId}/${entityType.toLowerCase()}/${entityId}/${Date.now()}-${safe}`;
  }

  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn = 3600,
    options?: { publicRead?: boolean },
  ): Promise<{ url: string; key: string; headers?: Record<string, string> }> {
    const publicRead = options?.publicRead ?? false;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      ...(publicRead ? { ACL: 'public-read' } : {}),
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return {
      url,
      key,
      ...(publicRead ? { headers: { 'x-amz-acl': 'public-read' } } : {}),
    };
  }

  getPublicUrl(key: string): string {
    if (this.publicUrlBase) {
      return `${this.publicUrlBase.replace(/\/$/, '')}/${key}`;
    }
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }
    const region = this.config.get<string>('SPACES_REGION') ?? 'us-east-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
