import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ALLOWED_FILE_TYPES } from '@vibe-crm/shared';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string | undefined;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('SPACES_BUCKET') ?? 'vibe-crm';
    this.endpoint = this.config.get<string>('SPACES_ENDPOINT');
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
  ): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, key };
  }

  getPublicUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }
    const region = this.config.get<string>('SPACES_REGION') ?? 'us-east-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
